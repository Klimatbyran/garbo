import { FastifyInstance, FastifyRequest } from 'fastify'
import { getTags } from '../../config/openapi'
import {
  userAuthenticationBodySchema,
  AuthentificationResponseScheme,
  getErrorSchemas,
  serviceAuthenticationBodySchema,
} from '../schemas'
import { userAuthenticationBody, serviceAuthenticationBody } from '../types'
import { authService } from '../services/authService'
import apiConfig from '../../config/api'

export async function authentificationRoutes(app: FastifyInstance) {
  app.get(
    '/github',
    {
      schema: {
        summary: 'Redirect to GitHub login',
        description: 'Redirects the user to GitHub OAuth page',
        tags: getTags('Auth'),
      },
    },
    async (request, reply) => {
      const githubAuthUrl = new URL('https://github.com/login/oauth/authorize')
      githubAuthUrl.searchParams.append('client_id', apiConfig.githubClientId)
      githubAuthUrl.searchParams.append(
        'redirect_uri',
        apiConfig.githubRedirectUri
      )
      githubAuthUrl.searchParams.append(
        'scope',
        'read:user user:email read:org'
      )

      return reply.redirect(githubAuthUrl.toString())
    }
  )

  app.post(
    '/github',
    {
      schema: {
        summary: 'Auth User with Github Identity',
        description: 'Authenticates a user using a Github access code',
        tags: getTags('Auth'),
        response: {
          200: AuthentificationResponseScheme,
          ...getErrorSchemas(401),
        },
        body: userAuthenticationBodySchema,
      },
    },
    async (
      request: FastifyRequest<{ Body: userAuthenticationBody }>,
      reply
    ) => {
      try {
        const token = await authService.authorizeUser(request.body.code)
        reply.status(200).send({ token })
      } catch (error) {
        console.log(error)
        return reply.status(401).send()
      }
    }
  )

  app.post(
    '/token',
    {
      schema: {
        summary: 'Auth Client with API Secret',
        description: 'Authenticates a client using a service secret',
        tags: getTags('Auth'),
        response: {
          200: AuthentificationResponseScheme,
          ...getErrorSchemas(401),
        },
        body: serviceAuthenticationBodySchema,
      },
    },
    async (
      request: FastifyRequest<{ Body: serviceAuthenticationBody }>,
      reply
    ) => {
      try {
        const token = await authService.authorizeService(request.body)
        reply.status(200).send({ token })
      } catch (error) {
        console.log(error)
        return reply.status(401).send()
      }
    }
  )
}
