import { FastifyInstance, RouteGenericInterface } from 'fastify'
import fp from 'fastify-plugin'
import { User } from '@prisma/client'

import apiConfig from '../../config/api'
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
        request.log.error('No token provided');
        return reply.status(401).send(unauthorizedError);
      }
      
      // First try JWT token verification
      try {
        const { user, newToken } = authService.verifyUser(token);
        
        if (newToken !== undefined) {
          // Send the new token back in the response headers
          reply.header('x-auth-token', newToken);
        }
        
        // Set the user on the request object
        request.user = user;
        return;
      } catch (jwtError) {
        request.log.error('JWT verification failed', jwtError);
        
        // If JWT verification fails, try API token
        if (!apiConfig.tokens?.includes(token)) {
          request.log.error('Invalid token', {
            token,
            apiConfigTokens: apiConfig.tokens,
          });
          return reply.status(401).send(unauthorizedError);
        }
        
        // For API tokens, set a null user
        request.user = null;
      }
    } catch (err) {
      request.log.error(err)
      return reply.status(401).send(unauthorizedError)
    }
  })
}

export default fp(authPlugin)
