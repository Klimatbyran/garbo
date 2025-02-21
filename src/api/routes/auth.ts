import { FastifyInstance, FastifyRequest } from "fastify"
import { getTags } from "../../config/openapi";
import { authentificationBodyScheme, AuthentificationResponseScheme, getErrorSchemas } from "../schemas";
import { authentificationBody } from "../types";
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
          body: authentificationBodyScheme
        },
      },
      async (
        request: FastifyRequest<{Body: authentificationBody}>,
        reply
      ) => {
        try {
            const token = await authService.authUser(request.body.code);
            reply.status(200).send({token});
        } catch(error) {
            console.log(error);
            return reply.status(401).send()
        }
      }
    )
  }