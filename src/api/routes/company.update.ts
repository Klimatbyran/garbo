import { AuthenticatedFastifyRequest, FastifyInstance } from 'fastify'

import { companyService } from '../services/companyService'
import {
  postCompanyBodySchema,
  okResponseSchema,
  getErrorSchemas,
} from '../schemas'
import { getTags } from '../../config/openapi'
import { PostCompanyBody, WikidataIdParams } from '../types'

export async function companyUpdateRoutes(app: FastifyInstance) {
  app.post(
    '/',
    {
      schema: {
        summary: 'Create or update a company',
        description:
          'Creates a new company or updates an existing one based on wikidataId',
        tags: getTags('Companies'),
        body: postCompanyBodySchema,
        response: {
          200: okResponseSchema,
          ...getErrorSchemas(400, 404),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Params: WikidataIdParams
        Body: PostCompanyBody
      }>,
      reply
    ) => {
      const { name, wikidataId, description, internalComment, tags, url } =
        request.body

      await companyService.upsertCompany({
        name,
        wikidataId,
        description,
        internalComment,
        tags,
        url,
      })

      reply.send({ ok: true })
    }
  )
}
