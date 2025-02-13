import { AuthenticatedFastifyRequest, FastifyInstance } from 'fastify'

import { wikidataService } from '../services/wikidataService'
import {
  postWikidataBodySchema,
  okResponseSchema,
  getErrorSchemas,
} from '../schemas'
import { getTags } from '../../config/openapi'
import { PostWikidataBody, WikidataIdParams } from '../types'

export async function wikidataUploadRoutes(app: FastifyInstance) {
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

      //TODO:

      request.log.info("Wikidata Update")
      const company = await wikidataService.updateWikidata(wikidataId)
      request.log.info(JSON.stringify(company))

      reply.send({ ok: true })
    }
  )
}
