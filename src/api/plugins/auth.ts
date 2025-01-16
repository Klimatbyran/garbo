import { FastifyInstance, RouteGenericInterface } from 'fastify'
import fp from 'fastify-plugin'
import { User } from '@prisma/client'

import apiConfig from '../../config/api'
import { GarboAPIError } from '../../lib/garbo-api-error'
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

async function authPlugin(app: FastifyInstance) {
  app.decorateRequest('user')
  app.addHook('onRequest', async (request) => {
    try {
      const token = request.headers['authorization']?.replace('Bearer ', '')

      if (!token || !apiConfig.tokens?.includes(token)) {
        throw GarboAPIError.unauthorized()
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
        throw GarboAPIError.unauthorized()
      }

      request.user = user
    } catch (error) {
      throw GarboAPIError.unauthorized()
    }
  })
}

export default fp(authPlugin)
