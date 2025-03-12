import { FastifyInstance, FastifyRequest } from "fastify"
import { getTags } from "../../config/openapi";
import { authenticationBodySchema, authenticationResponseSchema, getErrorSchemas } from "../schemas";
import { authenticationBody } from "../types";
import { authService } from "../services/authService";
import apiConfig from "../../config/api";
import { z } from "zod";

const unauthorizedError = {
    message: 'Unauthorized',
  }
  

export async function authentificationRoutes(app: FastifyInstance) {
    // Handler function for both GET and POST
    const handleGithubAuth = async (
      request: FastifyRequest<{Body?: authenticationBody, Querystring?: {code?: string}}>,
      reply
    ) => {
      try {
          request.log.info('GitHub auth request received', {
            method: request.method,
            query: request.query,
            body: request.body,
            headers: request.headers
          });
          
          // Get code from either query params (GET) or body (POST)
          const code = request.method === 'GET' 
            ? request.query.code 
            : request.body?.code;
            
          if (!code) {
            request.log.error('Missing authorization code');
            return reply.status(400).send({
              message: 'Missing authorization code',
              error: 'Bad Request',
              statusCode: 400
            });
          }
          
          request.log.info('Authenticating with GitHub code');
          const token = await authService.authUser(code);
          request.log.info('Authentication successful, token generated');
          
          // If this is a GET request from the browser, redirect to frontend with token
          if (request.method === 'GET' && request.headers['accept']?.includes('text/html')) {
            const redirectUrl = `${apiConfig.frontendURL}/auth/callback?token=${token}`;
            request.log.info(`Redirecting to: ${redirectUrl}`);
            return reply.redirect(redirectUrl);
          }
          
          // Otherwise just return the token as JSON
          request.log.info('Returning token as JSON');
          reply.status(200).send({token});
      } catch(error) {
          request.log.error('Authentication error:', error);
          
          // If this is a browser request, redirect to frontend with error
          if (request.method === 'GET' && request.headers['accept']?.includes('text/html')) {
            const errorRedirectUrl = `${apiConfig.frontendURL}/auth/callback?error=unauthorized`;
            request.log.info(`Redirecting to error page: ${errorRedirectUrl}`);
            return reply.redirect(errorRedirectUrl);
          }
          
          return reply.status(401).send(unauthorizedError);
      }
    };

    // Redirect to GitHub OAuth page
    app.get(
      '/github/login',
      {
        schema: {
          summary: 'Redirect to GitHub login',
          description: 'Redirects the user to GitHub OAuth page',
          tags: getTags('Auth'),
        },
      },
      async (request, reply) => {
        const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
        githubAuthUrl.searchParams.append('client_id', apiConfig.githubClientId);
        githubAuthUrl.searchParams.append('redirect_uri', apiConfig.githubRedirectUri);
        githubAuthUrl.searchParams.append('scope', 'read:user user:email read:org');
        
        return reply.redirect(githubAuthUrl.toString());
      }
    );
    
    // POST endpoint
    app.post(
      '/github',
      {
        schema: {
          summary: 'Auth User with Github Identity',
          description: 'Authenticates a user using a Github access code',
          tags: getTags('Auth'),
          response: {
            200: authenticationResponseSchema,
            ...getErrorSchemas(401, 400)
          },
          body: authenticationBodySchema
        },
      },
      handleGithubAuth
    );
    
    // GET endpoint
    app.get(
      '/github',
      {
        schema: {
          summary: 'Auth User with Github Identity (GET)',
          description: 'Authenticates a user using a Github access code provided as a query parameter',
          tags: getTags('Auth'),
          response: {
            200: authenticationResponseSchema,
            ...getErrorSchemas(401, 400)
          },
          querystring: z.object({
            code: z.string().openapi('GitHub authorization code')
          })
        },
      },
      handleGithubAuth
    );
    
    // User profile endpoint
    app.get(
      '/profile',
      {
        schema: {
          summary: 'Get User Profile',
          description: 'Returns the profile of the authenticated user',
          tags: getTags('Auth'),
          security: [{ BearerAuth: [] }],
          response: {
            200: z.object({
              id: z.string(),
              name: z.string().nullable(),
              email: z.string().nullable(),
              githubId: z.string().nullable(),
              githubImageUrl: z.string().nullable()
            }),
            ...getErrorSchemas(401)
          }
        }
      },
      async (request, reply) => {
        // The user is already set on the request by the auth plugin
        if (!request.user) {
          return reply.status(401).send(unauthorizedError);
        }
        
        return reply.send(request.user);
      }
    );
  }
