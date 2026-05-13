import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'

import apiConfig from '../../config/api'
import openAPIConfig from '../../config/openapi'
import { prisma } from '../../lib/prisma'
import {
  hashClientApiSecret,
  parseClientApiKey,
  timingSafeEqualHex,
} from '../../lib/clientApiKeyCrypto'
import {
  resolveClientApiPermission,
  type ClientApiPermissionCode,
} from '../security/routePermissions'

declare module 'fastify' {
  interface FastifyRequest {
    clientApiKeyId?: string
    clientApiPermission?: ClientApiPermissionCode
    clientApiKeyRoleSlug?: string
  }
}

/**
 * In-process per-key counter (rolling 60s window).
 * TODO: move to Redis or your API gateway when you need distributed / stricter limits.
 */
const rateBuckets = new Map<string, { count: number; windowStart: number }>()

function allowClientApiRate(keyId: string): boolean {
  const limit = apiConfig.clientApiRateLimitPerMinute
  const windowMs = 60_000
  const now = Date.now()
  const row = rateBuckets.get(keyId)
  if (!row || now - row.windowStart > windowMs) {
    rateBuckets.set(keyId, { count: 1, windowStart: now })
    return true
  }
  if (row.count >= limit) return false
  row.count += 1
  return true
}

function pathnameOnly(url: string): string {
  try {
    return new URL(url, 'http://localhost').pathname
  } catch {
    return url.split('?')[0] ?? url
  }
}

async function enforceClientApiKey(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (request.method === 'OPTIONS') return

  const pathname = pathnameOnly(request.url)

  if (!pathname.startsWith('/api/')) return

  if (pathname.startsWith('/api/auth')) return

  const docPrefix = `/${openAPIConfig.prefix}`
  if (pathname === docPrefix || pathname.startsWith(`${docPrefix}/`)) return

  const permission = resolveClientApiPermission(request.method, pathname)
  if (permission === null) return

  if (apiConfig.allowAnonymousClientApi) return

  const raw = request.headers['x-api-key']
  const rawKey = typeof raw === 'string' ? raw.trim() : ''
  if (!rawKey) {
    request.log.warn({
      event: 'client_api_key_auth',
      outcome: 'missing_key',
      permission,
      path: pathname,
    })
    return reply.status(401).send({
      error: 'Missing API key',
      message: 'Provide a valid key in the X-API-Key header.',
    })
  }

  const parsed = parseClientApiKey(rawKey)
  if (!parsed) {
    request.log.warn({
      event: 'client_api_key_auth',
      outcome: 'malformed_key',
      permission,
      path: pathname,
    })
    return reply.status(401).send({
      error: 'Invalid API key',
      message: 'Key must use the format garb_<lookup>.<secret>.',
    })
  }

  const keyRow = await prisma.clientApiKey.findFirst({
    where: { keyLookup: parsed.keyLookup, revokedAt: null },
    include: {
      role: {
        include: {
          permissions: { include: { permission: true } },
        },
      },
    },
  })

  if (!keyRow) {
    request.log.warn({
      event: 'client_api_key_auth',
      outcome: 'unknown_key',
      keyLookup: parsed.keyLookup,
      permission,
      path: pathname,
    })
    return reply.status(401).send({
      error: 'Invalid API key',
      message: 'Unknown or revoked key.',
    })
  }

  const expected = hashClientApiSecret(
    parsed.keyLookup,
    parsed.secretPart,
    apiConfig.clientApiKeyPepper
  )
  if (!timingSafeEqualHex(expected, keyRow.secretHash)) {
    request.log.warn({
      event: 'client_api_key_auth',
      outcome: 'bad_secret',
      clientApiKeyId: keyRow.id,
      permission,
      path: pathname,
    })
    return reply.status(401).send({
      error: 'Invalid API key',
      message: 'Key verification failed.',
    })
  }

  const allowed = new Set(
    keyRow.role.permissions.map((rp) => rp.permission.code)
  )
  if (!allowed.has(permission)) {
    request.log.warn({
      event: 'client_api_key_auth',
      outcome: 'forbidden',
      clientApiKeyId: keyRow.id,
      permission,
      path: pathname,
    })
    return reply.status(403).send({
      error: 'Forbidden',
      message: 'This API key is not allowed to access this endpoint.',
    })
  }

  if (!allowClientApiRate(keyRow.id)) {
    request.log.warn({
      event: 'client_api_key_auth',
      outcome: 'rate_limited',
      clientApiKeyId: keyRow.id,
      permission,
      path: pathname,
    })
    return reply.status(429).send({
      error: 'Too many requests',
      message: 'Rate limit exceeded for this API key.',
    })
  }

  request.clientApiKeyId = keyRow.id
  request.clientApiPermission = permission
  request.clientApiKeyRoleSlug = keyRow.role.slug
  request.log.info({
    event: 'client_api_key_auth',
    outcome: 'allowed',
    clientApiKeyId: keyRow.id,
    permission,
    path: pathname,
  })

  void prisma.clientApiKey.update({
    where: { id: keyRow.id },
    data: { lastUsedAt: new Date() },
  })
}

async function clientApiKeyGatePlugin(app: FastifyInstance) {
  app.addHook('onRequest', enforceClientApiKey)

  app.addHook('onResponse', (request, reply, done) => {
    const keyId = request.clientApiKeyId
    if (keyId && request.clientApiKeyRoleSlug !== 'all_access') {
      prisma.clientApiRequest
        .create({
          data: {
            keyId,
            path: pathnameOnly(request.url),
            method: request.method,
            statusCode: reply.statusCode,
          },
        })
        .catch((err) =>
          request.log.error({ event: 'client_api_request_log_error', err })
        )
    }
    done()
  })

  // Prune entries whose rate window expired
  const pruner = setInterval(() => {
    const cutoff = Date.now() - 120_000
    for (const [id, row] of rateBuckets) {
      if (row.windowStart < cutoff) rateBuckets.delete(id)
    }
  }, 60_000)
  pruner.unref()
}

export default fp(clientApiKeyGatePlugin, {
  name: 'clientApiKeyGate',
})
