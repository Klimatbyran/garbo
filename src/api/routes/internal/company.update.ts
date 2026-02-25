import { AuthenticatedFastifyRequest, FastifyInstance } from 'fastify'

import { companyService } from '../../services/companyService'
import {
  postCompanyBodySchema,
  okResponseSchema,
  getErrorSchemas,
} from '../../schemas'
import { getTags } from '../../../config/openapi'
import { PostCompanyBody, WikidataIdParams } from '../../types'
import { metadataService } from '../../services/metadataService'

export async function companyUpdateRoutes(app: FastifyInstance) {
  app.post(
    '/:wikidataId',
    {
      schema: {
        summary: 'Create or update a company',
        description:
          'Creates a new company or updates an existing one based on wikidataId',
        tags: getTags('Companies'),
        body: postCompanyBodySchema,
        response: {
          200: okResponseSchema,
          ...getErrorSchemas(400, 404, 500),
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
      const {
        name,
        wikidataId,
        descriptions,
        internalComment,
        tags,
        url,
        logoUrl,
        lei,
        metadata,
      } = request.body
      try {
        await companyService.upsertCompany({
          name,
          wikidataId,
          internalComment,
          tags,
          url,
          logoUrl,
          lei,
        })
        // Create descriptions
        descriptions?.map(async (description) => {
          const createdMetadata = await metadataService.createMetadata({
            user: request.user,
            metadata,
          })
          await companyService.upsertDescription({
            description,
            companyId: wikidataId,
            metadataId: createdMetadata.id,
          })
        })
        return reply.send({ ok: true })
      } catch (error) {
        console.error('ERROR Creation or update of company failed:', error)
        return reply
          .status(500)
          .send({ message: 'Creation or update of company failed.' })
      }
    }
  )
}
