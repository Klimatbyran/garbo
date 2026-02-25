import { FastifyInstance, RouteGenericInterface } from 'fastify'
import fp from 'fastify-plugin'
import { User } from '@prisma/client'
import { authService } from '../services/authService'

declare module 'fastify' {
  export interface FastifyRequest {
    user: User | null
  }

  export interface AuthenticatedFastifyRequest<T extends RouteGenericInterface>
    extends FastifyRequest<T> {
    user: User
  }
}

const unauthorizedError = {
  message: 'Unauthorized',
}

async function authPlugin(app: FastifyInstance) {
  app.decorateRequest('user')
  app.addHook('onRequest', async (request, reply) => {
    try {
      const token = request.headers['authorization']?.replace('Bearer ', '')

      if (!token) {
        request.log.error('No token provided')
        return reply.status(401).send(unauthorizedError)
      }

      const { user, newToken } = authService.verifyToken(token)

      if (newToken !== undefined) {
        reply.headers['x-auth-token'] = newToken
      }
      request.user = user
    } catch (err) {
      console.log(err)
      request.log.error('Authentication failed:', err)
      return reply.status(401).send(unauthorizedError)
    }
  })
}

export default fp(authPlugin)
