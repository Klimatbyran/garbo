import { FastifyInstance, FastifyRequest } from "fastify"
import { getTags } from "../../config/openapi";
import { authenticationBodySchema, AuthentificationResponseScheme, getErrorSchemas } from "../schemas";
import { authenticationBody } from "../types";
import { authService } from "../services/authService";
import apiConfig from "../../config/api";

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
      const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
      githubAuthUrl.searchParams.append('client_id', apiConfig.githubClientId);
      githubAuthUrl.searchParams.append('redirect_uri', apiConfig.githubRedirectUri);
      githubAuthUrl.searchParams.append('scope', 'read:user user:email read:org');
      
      return reply.redirect(githubAuthUrl.toString());
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
          console.log(error);
          return reply.status(401).send()
      }
    }
  )
}