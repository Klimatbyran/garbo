import { FastifyInstance, FastifyRequest } from "fastify"
import { getTags } from "../../config/openapi";
import { authenticationBodySchema, AuthentificationResponseScheme, getErrorSchemas } from "../schemas";
import { authenticationBody } from "../types";
import { authService } from "../services/authService";

const unauthorizedError = {
    message: 'Unauthorized',
  }
  

export async function authentificationRoutes(app: FastifyInstance) {
    app.post(
      '/github',
      {
        schema: {
          summary: 'Auth User with Github Identity',
          description: 'Authenticates a user using a Github access code',
          tags: getTags('Auth'),
          response: {
            200: AuthentificationResponseScheme,
            ...getErrorSchemas(401)
          },
          body: authenticationBodySchema
        },
      },
      async (
        request: FastifyRequest<{Body: authenticationBody}>,
        reply
      ) => {
        try {
            const token = await authService.authUser(request.body.code);
            reply.status(200).send({token});
        } catch(error) {
            request.log.error(error);
            return reply.status(401).send(unauthorizedError);
        }
      }
    )
  }
