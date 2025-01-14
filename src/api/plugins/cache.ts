import { FastifyInstance } from 'fastify'
import apiConfig from '../../config/api'

export function cachePlugin(app: FastifyInstance) {
  app.addHook('onSend', (request, reply) => {
    reply.header('cache-control', `public, max-age=${apiConfig.cacheMaxAge}`)
  })
}
