/**
 * Tests for clientApiKeys.admin routes.
 *
 * Because this project runs Jest in ESM mode, Prisma is mocked via
 * jest.unstable_mockModule (not jest.mock), and the routes module is loaded
 * via a dynamic import AFTER the mock is registered.
 */
import { jest, describe, it, expect, afterEach, beforeAll } from '@jest/globals'
import type { FastifyInstance } from 'fastify'
import { clientApiRouteRules } from '../../security/routePermissions'

// Register the mock before any dynamic import of the routes module, so the
// routes file sees the mocked prisma when it is first evaluated.
jest.unstable_mockModule('../../../lib/prisma', () => ({
  prisma: {
    clientApiKey: {
      findUnique: jest.fn<() => Promise<unknown>>(),
      findMany: jest.fn<() => Promise<unknown[]>>(),
      update: jest.fn<() => Promise<unknown>>(),
      create: jest.fn<() => Promise<unknown>>(),
    },
    clientApiRole: {
      findMany: jest.fn<() => Promise<unknown[]>>(),
      findUnique: jest.fn<() => Promise<unknown>>(),
    },
  },
}))

// These are resolved in beforeAll after the mock is in place.
let buildApp: () => FastifyInstance
let mockFindUnique: jest.Mock<() => Promise<unknown>>
let mockUpdate: jest.Mock<() => Promise<unknown>>

beforeAll(async () => {
  const [
    { default: Fastify },
    { serializerCompiler, validatorCompiler },
    prismaModule,
    routesModule,
  ] = await Promise.all([
    import('fastify'),
    import('fastify-type-provider-zod'),
    import('../../../lib/prisma'),
    import('./clientApiKeys.admin'),
  ])

  mockFindUnique = (prismaModule.prisma.clientApiKey as unknown as { findUnique: jest.Mock<() => Promise<unknown>> }).findUnique
  mockUpdate = (prismaModule.prisma.clientApiKey as unknown as { update: jest.Mock<() => Promise<unknown>> }).update

  buildApp = () => {
    const app = Fastify({ logger: false })
    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)
    app.decorateRequest('user', null)
    app.addHook('onRequest', (request, _reply, done) => {
      ;(request as unknown as { user: { id: string } }).user = { id: 'test-staff-id' }
      done()
    })
    app.register(routesModule.clientApiKeysAdminRoutes)
    return app
  }
})

afterEach(() => {
  jest.clearAllMocks()
})

// ---------------------------------------------------------------------------
// GET /endpoint-catalog
// ---------------------------------------------------------------------------

describe('GET /endpoint-catalog', () => {
  it('returns one entry per route rule', async () => {
    const app = buildApp()
    await app.ready()

    const res = await app.inject({ method: 'GET', url: '/endpoint-catalog' })

    expect(res.statusCode).toBe(200)
    const body = res.json<unknown[]>()
    expect(body).toHaveLength(clientApiRouteRules.length)

    await app.close()
  })

  it('each entry has method, type, path, and permission', async () => {
    const app = buildApp()
    await app.ready()

    const res = await app.inject({ method: 'GET', url: '/endpoint-catalog' })
    const body = res.json<{ method: string; type: string; path: string; permission: string }[]>()

    for (const entry of body) {
      expect(typeof entry.method).toBe('string')
      expect(['exact', 'prefix']).toContain(entry.type)
      expect(entry.path.startsWith('/api/')).toBe(true)
      expect(typeof entry.permission).toBe('string')
    }

    await app.close()
  })

  it('matches clientApiRouteRules exactly', async () => {
    const app = buildApp()
    await app.ready()

    const res = await app.inject({ method: 'GET', url: '/endpoint-catalog' })
    const body = res.json<{ method: string; type: string; path: string; permission: string }[]>()

    expect(body).toEqual(
      clientApiRouteRules.map((r) => ({
        method: r.method,
        type: r.type,
        path: r.path,
        permission: r.permission,
      }))
    )

    await app.close()
  })
})

// ---------------------------------------------------------------------------
// DELETE /:id  (revoke)
// ---------------------------------------------------------------------------

const baseKey = {
  id: 'key-abc',
  name: 'Test Key',
  keyLookup: 'testlookup',
  secretHash: 'hash',
  roleId: 'role-1',
  revokedAt: null,
  lastUsedAt: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  role: { id: 'role-1', slug: 'base', label: 'Base' },
}

describe('POST /:id/revoke', () => {
  it('returns 404 when the key does not exist', async () => {
    mockFindUnique.mockResolvedValueOnce(null)
    const app = buildApp()
    await app.ready()

    const res = await app.inject({ method: 'POST', url: '/key-missing/revoke' })

    expect(res.statusCode).toBe(404)
    expect(mockUpdate).not.toHaveBeenCalled()

    await app.close()
  })

  it('returns 409 when the key is already revoked', async () => {
    mockFindUnique.mockResolvedValueOnce({
      ...baseKey,
      revokedAt: new Date('2026-01-15T00:00:00Z'),
    })
    const app = buildApp()
    await app.ready()

    const res = await app.inject({ method: 'POST', url: '/key-abc/revoke' })

    expect(res.statusCode).toBe(409)
    expect(mockUpdate).not.toHaveBeenCalled()

    await app.close()
  })

  it('sets revokedAt and returns the updated key on success', async () => {
    const revokedAt = new Date('2026-05-12T10:00:00Z')
    mockFindUnique.mockResolvedValueOnce(baseKey)
    mockUpdate.mockResolvedValueOnce({ ...baseKey, revokedAt })
    const app = buildApp()
    await app.ready()

    const res = await app.inject({ method: 'POST', url: '/key-abc/revoke' })

    expect(res.statusCode).toBe(200)
    const body = res.json<{ id: string; revokedAt: string | null }>()
    expect(body.id).toBe('key-abc')
    expect(body.revokedAt).toBe(revokedAt.toISOString())
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'key-abc' },
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      })
    )

    await app.close()
  })

  it('response includes lastUsedAt when set', async () => {
    const lastUsedAt = new Date('2026-05-10T08:00:00Z')
    const revokedAt = new Date('2026-05-12T10:00:00Z')
    mockFindUnique.mockResolvedValueOnce({ ...baseKey, lastUsedAt })
    mockUpdate.mockResolvedValueOnce({ ...baseKey, lastUsedAt, revokedAt })
    const app = buildApp()
    await app.ready()

    const res = await app.inject({ method: 'POST', url: '/key-abc/revoke' })
    const body = res.json<{ lastUsedAt: string | null }>()

    expect(res.statusCode).toBe(200)
    expect(body.lastUsedAt).toBe(lastUsedAt.toISOString())

    await app.close()
  })
})
