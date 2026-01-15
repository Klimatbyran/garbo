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
import { z } from 'zod'

const githubAuthQuerySchema = z.object({
  redirect_uri: z.string().url().optional(),
  client: z.string().optional(),
})

export async function authentificationRoutes(app: FastifyInstance) {
  app.get(
    '/github',
    {
      schema: {
        summary: 'Redirect to GitHub login',
        description: 'Redirects the user to GitHub OAuth page',
        tags: getTags('Auth'),
        querystring: githubAuthQuerySchema,
      },
    },
    async (request, reply) => {
      const query = request.query as { redirect_uri?: string; client?: string }

      // Always use the registered redirect_uri (must match GitHub OAuth app settings)
      // The actual frontend redirect will be handled by the callback endpoint
      const redirectUri = apiConfig.githubRedirectUri

      // Build state parameter to pass frontend redirect info through OAuth flow
      // This tells the callback endpoint where to redirect after successful auth
      const state =
        query.client || query.redirect_uri
          ? Buffer.from(
              JSON.stringify({
                client: query.client,
                redirect_uri: query.redirect_uri || apiConfig.frontendURL,
              }),
            ).toString('base64')
          : undefined

      const githubAuthUrl = new URL('https://github.com/login/oauth/authorize')
      githubAuthUrl.searchParams.append('client_id', apiConfig.githubClientId)
      githubAuthUrl.searchParams.append('redirect_uri', redirectUri)
      githubAuthUrl.searchParams.append(
        'scope',
        'read:user user:email read:org',
      )

      if (state) {
        githubAuthUrl.searchParams.append('state', state)
      }

      return reply.redirect(githubAuthUrl.toString())
    },
  )

  const githubCallbackQuerySchema = z.object({
    code: z.string().optional(),
    state: z.string().optional(),
    error: z.string().optional(),
    error_description: z.string().optional(),
  })

  // GitHub OAuth callback endpoint
  // This endpoint receives the callback from GitHub and redirects to the appropriate frontend
  app.get(
    '/github/callback',
    {
      schema: {
        summary: 'GitHub OAuth callback',
        description:
          'Handles the OAuth callback from GitHub and redirects to the frontend',
        tags: getTags('Auth'),
        querystring: githubCallbackQuerySchema,
      },
    },
    async (request, reply) => {
      const query = request.query as {
        code?: string
        state?: string
        error?: string
        error_description?: string
      }

      // Handle OAuth errors
      if (query.error) {
        const errorUrl = new URL(apiConfig.frontendURL)
        errorUrl.searchParams.append('error', query.error)
        if (query.error_description) {
          errorUrl.searchParams.append(
            'error_description',
            query.error_description,
          )
        }
        return reply.redirect(errorUrl.toString())
      }

      if (!query.code) {
        const errorUrl = new URL(apiConfig.frontendURL)
        errorUrl.searchParams.append('error', 'missing_code')
        return reply.redirect(errorUrl.toString())
      }

      // Decode state to get the target frontend URL
      let targetRedirectUri = apiConfig.frontendURL
      if (query.state) {
        try {
          const stateData = JSON.parse(
            Buffer.from(query.state, 'base64').toString(),
          ) as { redirect_uri?: string; client?: string }

          if (stateData.redirect_uri) {
            // Validate redirect_uri against allowed origins to prevent open redirect attacks
            const allowedOrigins = apiConfig.corsAllowOrigins
            const redirectUrl = new URL(stateData.redirect_uri)
            const isAllowed = allowedOrigins.some((origin) => {
              try {
                const originUrl = new URL(origin)
                return redirectUrl.origin === originUrl.origin
              } catch {
                return false
              }
            })

            if (isAllowed) {
              targetRedirectUri = stateData.redirect_uri
            } else {
              // Log potential security issue but don't expose to attacker
              request.log.warn(
                { redirect_uri: stateData.redirect_uri, allowedOrigins },
                'Blocked redirect to unauthorized origin',
              )
            }
          }
        } catch (error) {
          // If state can't be decoded, use default frontend
          request.log.warn(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            'Failed to decode state parameter',
          )
        }
      }

      try {
        // Exchange code for token
        const token = await authService.authorizeUser(
          query.code,
          apiConfig.githubRedirectUri,
        )

        // TODO: Switch to one-time code exchange instead of token in URL
        // Generate a short-lived code, store token in Redis, redirect with code
        // Frontend exchanges code for token via POST /api/auth/exchange
        // This avoids exposing tokens in URLs (browser history, logs, referrer headers)
        // Redirect to frontend with token
        const redirectUrl = new URL(targetRedirectUri)
        redirectUrl.searchParams.append('token', token)
        if (query.state) {
          redirectUrl.searchParams.append('state', query.state)
        }

        return reply.redirect(redirectUrl.toString())
      } catch (error) {
        request.log.error({ error }, 'GitHub OAuth callback error')
        const errorUrl = new URL(targetRedirectUri)
        errorUrl.searchParams.append('error', 'authentication_failed')
        errorUrl.searchParams.append(
          'error_description',
          error instanceof Error ? error.message : 'Unknown error',
        )
        return reply.redirect(errorUrl.toString())
      }
    },
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
      reply,
    ) => {
      try {
        // Decode state if provided to get client/redirect_uri info
        let redirectUri = apiConfig.githubRedirectUri
        let clientInfo: { client?: string; redirect_uri?: string } | null = null

        if (request.body.state) {
          try {
            const stateData = JSON.parse(
              Buffer.from(request.body.state, 'base64').toString(),
            ) as { redirect_uri?: string; client?: string }
            if (stateData.redirect_uri) {
              redirectUri = stateData.redirect_uri
            }
            clientInfo = {
              client: stateData.client,
              redirect_uri: stateData.redirect_uri,
            }
          } catch {
            // If state can't be decoded, ignore it
            clientInfo = null
          }
        }

        const token = await authService.authorizeUser(
          request.body.code,
          redirectUri,
        )

        // Return token and optionally the client info so frontend knows where to redirect
        const response: {
          token: string
          client?: string
          redirect_uri?: string
        } = {
          token,
        }
        if (clientInfo) {
          if (clientInfo.client) {
            response.client = clientInfo.client
          }
          if (clientInfo.redirect_uri) {
            response.redirect_uri = clientInfo.redirect_uri
          }
        }

        reply.status(200).send(response)
      } catch (error) {
        request.log.error({ error }, 'GitHub authentication error')
        return reply.status(401).send()
      }
    },
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
      reply,
    ) => {
      try {
        const token = await authService.authorizeService(request.body)
        reply.status(200).send({ token })
      } catch (error) {
        request.log.error({ error }, 'Service authentication error')
        return reply.status(401).send()
      }
    },
  )
}
