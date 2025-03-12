import { FastifyInstance, FastifyRequest } from "fastify"
import { getTags } from "../../config/openapi";
import { authenticationBodySchema, authenticationResponseSchema, getErrorSchemas } from "../schemas";
import { authenticationBody } from "../types";
import { authService } from "../services/authService";
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
          // Get code from either query params (GET) or body (POST)
          const code = request.method === 'GET' 
            ? request.query.code 
            : request.body?.code;
            
          if (!code) {
            return reply.status(400).send({
              message: 'Missing authorization code',
              error: 'Bad Request',
              statusCode: 400
            });
          }
          
          const token = await authService.authUser(code);
          
          // If this is a GET request from the browser, redirect to frontend with token
          if (request.method === 'GET' && request.headers['accept']?.includes('text/html')) {
            return reply.redirect(`${apiConfig.frontendURL}/auth/callback?token=${token}`);
          }
          
          // Otherwise just return the token as JSON
          reply.status(200).send({token});
      } catch(error) {
          request.log.error(error);
          
          // If this is a browser request, redirect to frontend with error
          if (request.method === 'GET' && request.headers['accept']?.includes('text/html')) {
            return reply.redirect(`${apiConfig.frontendURL}/auth/callback?error=unauthorized`);
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
        githubAuthUrl.searchParams.append('redirect_uri', `${apiConfig.baseURL}/auth/github`);
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
  }
