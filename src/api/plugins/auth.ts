import { FastifyInstance, RouteGenericInterface } from 'fastify'
import fp from 'fastify-plugin'
import { User } from '@prisma/client'

import apiConfig from '../../config/api'
import { prisma } from '../../lib/prisma'

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

      if (!token || !apiConfig.tokens?.includes(token)) {
        return reply.status(401).send(unauthorizedError)
      }

      const [username] = token.split(':')
      const userEmail =
        username === 'garbo'
          ? apiConfig.authorizedUsers.garbo
          : apiConfig.authorizedUsers.alex

      const user = await prisma.user.findFirst({
        where: { email: userEmail },
      })

      if (!user?.id) {
        return reply.status(401).send(unauthorizedError)
      }

      request.user = user
    } catch {
      return reply.status(401).send(unauthorizedError)
    }
  })
}

export default fp(authPlugin)
