import { FastifyInstance, FastifyRequest } from "fastify"
import { getTags } from "../../config/openapi";
import { authenticationBodySchema, authenticationResponseSchema, getErrorSchemas } from "../schemas";
import { authenticationBody } from "../types";
import { authService } from "../services/authService";

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
          reply.status(200).send({token});
      } catch(error) {
          request.log.error(error);
          return reply.status(401).send(unauthorizedError);
      }
    };

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
          querystring: {
            type: 'object',
            properties: {
              code: { type: 'string', description: 'GitHub authorization code' }
            }
          }
        },
      },
      handleGithubAuth
    );
  }
