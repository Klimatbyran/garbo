import Fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'

import { resolveClientApiPermission } from './api/security/routePermissions'
import { registerClientApiRoutes } from './registerClientApiRoutes'

/**
 * Ensures every route registered on the client API surface has a matching
 * entry in the central permission registry (Option A).
 */
describe('registerClientApiRoutes ↔ routePermissions registry', () => {
  it('assigns a permission to every /api route except /api/auth (onRoute inventory)', async () => {
    const app = Fastify({ logger: false })
    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)

    const collected: { method: string; path: string }[] = []
    app.addHook('onRoute', (opts) => {
      const methods = Array.isArray(opts.method) ? opts.method : [opts.method]
      for (const m of methods) {
        if (m === 'HEAD') continue
        collected.push({ method: m, path: opts.url })
      }
    })

    await app.register(registerClientApiRoutes)
    await app.ready()

    const apiRoutes = collected.filter(
      (r) => r.path.startsWith('/api/') && !r.path.startsWith('/api/auth')
    )

    for (const r of apiRoutes) {
      const perm = resolveClientApiPermission(r.method, r.path)
      if (perm === null) {
        throw new Error(`No registry rule for ${r.method} ${r.path}`)
      }
    }

    await app.close()
  })
})
