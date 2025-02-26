import { AuthenticatedFastifyRequest, FastifyInstance } from 'fastify'
import { wikipediaService } from '../services/wikipediaService'
import {
  postWikidataBodySchema,
  okResponseSchema,
  getErrorSchemas,
} from '../schemas'
import { getTags } from '../../config/openapi'
import { PostWikidataBody, WikidataIdParams } from '../types'

export async function wikiUpdateRoutes(app: FastifyInstance) {
  app.post(
    '/',
    {
      schema: {
        summary: 'Create or update a company',
        description:
          'Creates a new company or updates an existing one based on wikidataId',
        tags: getTags('Wikidata'),
        body: postWikidataBodySchema,
        response: {
          200: okResponseSchema,
          ...getErrorSchemas(400, 404),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Params: WikidataIdParams
        Body: PostWikidataBody
      }>,
      reply
    ) => {
      const { wikidataId } = request.body
      await wikipediaService.updateWikipedia(wikidataId)
      reply.send({ ok: true })
    }
  )
}
