import { randomBytes } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import type { AuthenticatedFastifyRequest } from 'fastify'
import { z } from 'zod'

import apiConfig from '../../../config/api'
import { getTags } from '../../../config/openapi'
import { hashClientApiSecret } from '../../../lib/clientApiKeyCrypto'
import { prisma } from '../../../lib/prisma'
import { getErrorSchemas } from '../../schemas'

const permissionCodeSchema = z.object({
  code: z.string(),
  label: z.string().nullable(),
})

const clientApiRoleListItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  label: z.string().nullable(),
  permissions: z.array(permissionCodeSchema),
})

const clientApiKeyListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  keyLookup: z.string(),
  revokedAt: z.string().nullable(),
  createdAt: z.string(),
  role: z.object({
    id: z.string(),
    slug: z.string(),
    label: z.string().nullable(),
  }),
})

const createClientApiKeyBodySchema = z.object({
  name: z.string().trim().min(1).max(128),
  roleId: z.string().min(1),
  /** If omitted, a unique random lookup segment is generated. */
  keyLookup: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
})

const createClientApiKeyResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  keyLookup: z.string(),
  roleId: z.string(),
  /** Full `garb_<lookup>.<secret>` — returned only in this response; store it safely. */
  apiKey: z.string(),
})

function generateKeyLookup(): string {
  return `k${randomBytes(12).toString('hex')}`
}

async function pickUniqueKeyLookup(
  preferred: string | undefined
): Promise<string> {
  if (preferred) {
    const clash = await prisma.clientApiKey.findUnique({
      where: { keyLookup: preferred },
      select: { id: true },
    })
    if (!clash) return preferred
    throw Object.assign(new Error('key_lookup_taken'), { code: 409 })
  }
  for (let i = 0; i < 8; i += 1) {
    const candidate = generateKeyLookup()
    const clash = await prisma.clientApiKey.findUnique({
      where: { keyLookup: candidate },
      select: { id: true },
    })
    if (!clash) return candidate
  }
  throw new Error('Could not allocate unique keyLookup')
}

export async function clientApiKeysAdminRoutes(app: FastifyInstance) {
  app.get(
    '/roles',
    {
      schema: {
        summary: 'List client API roles and permissions',
        description:
          'Staff only (Bearer JWT). Returns roles that can be assigned when creating client API keys.',
        tags: getTags('Internal'),
        response: {
          200: z.array(clientApiRoleListItemSchema),
          ...getErrorSchemas(401, 500),
        },
      },
    },
    async (_request, reply) => {
      const roles = await prisma.clientApiRole.findMany({
        orderBy: { slug: 'asc' },
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      })
      return reply.send(
        roles.map((r) => ({
          id: r.id,
          slug: r.slug,
          label: r.label,
          permissions: r.permissions.map((rp) => ({
            code: rp.permission.code,
            label: rp.permission.label,
          })),
        }))
      )
    }
  )

  app.get(
    '/',
    {
      schema: {
        summary: 'List client API keys (metadata)',
        description:
          'Staff only. Lists key metadata — never returns secret hashes or plaintext keys.',
        tags: getTags('Internal'),
        response: {
          200: z.array(clientApiKeyListItemSchema),
          ...getErrorSchemas(401, 500),
        },
      },
    },
    async (_request, reply) => {
      const keys = await prisma.clientApiKey.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          role: { select: { id: true, slug: true, label: true } },
        },
      })
      return reply.send(
        keys.map((k) => ({
          id: k.id,
          name: k.name,
          keyLookup: k.keyLookup,
          revokedAt: k.revokedAt?.toISOString() ?? null,
          createdAt: k.createdAt.toISOString(),
          role: k.role,
        }))
      )
    }
  )

  app.post(
    '/',
    {
      schema: {
        summary: 'Create a client API key',
        description:
          'Staff only. Creates a key for the given role. The full `apiKey` string is returned once; it cannot be retrieved again.',
        tags: getTags('Internal'),
        body: createClientApiKeyBodySchema,
        response: {
          200: createClientApiKeyResponseSchema,
          ...getErrorSchemas(400, 401, 404, 409, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{ Body: z.infer<typeof createClientApiKeyBodySchema> }>,
      reply
    ) => {
      const { name, roleId, keyLookup: keyLookupInput } = request.body

      const role = await prisma.clientApiRole.findUnique({
        where: { id: roleId },
        select: { id: true },
      })
      if (!role) {
        return reply.status(404).send({
          code: '404',
          message: 'Role not found',
        })
      }

      let keyLookup: string
      try {
        keyLookup = await pickUniqueKeyLookup(keyLookupInput)
      } catch (e: unknown) {
        if (e && typeof e === 'object' && 'code' in e && (e as { code: number }).code === 409) {
          return reply.status(409).send({
            code: '409',
            message: `keyLookup "${keyLookupInput}" is already in use`,
          })
        }
        throw e
      }

      const secretPart = randomBytes(32).toString('hex')
      const apiKey = `garb_${keyLookup}.${secretPart}`
      const secretHash = hashClientApiSecret(
        keyLookup,
        secretPart,
        apiConfig.clientApiKeyPepper
      )

      const created = await prisma.clientApiKey.create({
        data: {
          name,
          keyLookup,
          secretHash,
          roleId,
        },
        select: { id: true, name: true, keyLookup: true, roleId: true },
      })

      request.log.info(
        {
          event: 'client_api_key_created',
          clientApiKeyId: created.id,
          keyLookup: created.keyLookup,
          roleId: created.roleId,
          createdByUserId: request.user.id,
        },
        'Staff created client API key'
      )

      return reply.send({
        id: created.id,
        name: created.name,
        keyLookup: created.keyLookup,
        roleId: created.roleId,
        apiKey,
      })
    }
  )
}
