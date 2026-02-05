import { FastifyInstance, RouteGenericInterface } from 'fastify'
import fp from 'fastify-plugin'
import { User, ApiToken } from '@prisma/client'
import { authService } from '../services/authService'
import { apiTokenService } from '../services/apiTokenService'
import openAPIConfig from '../../config/openapi'

declare module 'fastify' {
  export interface FastifyRequest {
    user: User | null
    apiToken: ApiToken | null
  }

  export interface AuthenticatedFastifyRequest<T extends RouteGenericInterface> extends FastifyRequest<T> {
    user: User
  }
}

const unauthorizedError = {
  message: 'Unauthorized',
}

const forbiddenError = {
  message: 'Forbidden - Insufficient permissions',
}

async function authPlugin(app: FastifyInstance) {
  app.decorateRequest('user', null)
  app.decorateRequest('apiToken', null)

  app.addHook('onRequest', async (request, reply) => {
    // Skip authentication for auth routes
    if (request.url.startsWith('/api/auth')) {
      return
    }

    // Skip authentication for static files and root redirect
    if (
      request.url === '/' ||
      request.url.startsWith('/favicon.ico') ||
      request.url.startsWith('/public') ||
      request.url.startsWith(`/${openAPIConfig.prefix}`)
    ) {
      return
    }

    try {
      const token = request.headers['authorization']?.replace('Bearer ', '')

      if (!token) {
        request.log.error('No token provided')
        return reply.status(401).send(unauthorizedError)
      }

      // Try to verify as JWT token first (for user authentication)
      try {
        const { user, newToken } = authService.verifyToken(token)
        if (newToken !== undefined) {
          reply.headers['x-auth-token'] = newToken
        }
        request.user = user
        // User tokens have full access, so we don't need to check permissions
        return
      } catch (jwtError) {
        // JWT verification failed, try API token
      }

      // Try to verify as API token
      const apiToken = await apiTokenService.verifyToken(token)
      if (!apiToken) {
        request.log.error('Invalid token')
        return reply.status(401).send(unauthorizedError)
      }

      request.apiToken = apiToken

      // Check permissions for API tokens
      const { pathname } = new URL(request.url, `http://${request.headers.host}`)

      // Extract the endpoint prefix (e.g., "api/companies" from "/api/companies/123")
      const hasPermission = apiTokenService.hasPermission(
        apiToken.permissions,
        pathname,
      )

      if (!hasPermission) {
        request.log.warn(
          {
            path: pathname,
            permissions: apiToken.permissions,
            tokenId: apiToken.id,
          },
          'Access denied - insufficient permissions',
        )
        return reply.status(403).send(forbiddenError)
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      request.log.error('Authentication failed:', error)
      return reply.status(401).send(unauthorizedError)
    }
  })
}

export default fp(authPlugin)