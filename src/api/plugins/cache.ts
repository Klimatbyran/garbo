import { FastifyInstance } from 'fastify'
import apiConfig from '../../config/api'

/**
 * Default HTTP cache headers for read routes.
 * When the response can vary by client API key scope, shared caches must not
 * reuse one caller's body for another (see partner company list + trial keys).
 */
export function cachePlugin(app: FastifyInstance) {
  app.addHook('onSend', (request, reply) => {
    if (request.clientApiCompanyScope) {
      reply.header('cache-control', 'private, no-store')
      reply.header('vary', 'X-API-Key')
      return
    }
    if (request.clientApiKeyId) {
      reply.header('vary', 'X-API-Key')
    }
    reply.header('cache-control', `public, max-age=${apiConfig.cacheMaxAge}`)
  })
}
