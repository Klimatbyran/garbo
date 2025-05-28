import { AuthenticatedFastifyRequest, FastifyInstance } from 'fastify'

import { companyService } from '../services/companyService'
import {
  postCompanyBodySchema,
  okResponseSchema,
  getErrorSchemas,
  postDescriptionsBodySchema,
} from '../schemas'
import { getTags } from '../../config/openapi'
import { PostCompanyBody, PostDescriptionsBody, WikidataIdParams } from '../types'
import { metadataService } from '../services/metadataService'

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
      const { name, wikidataId, internalComment, tags, url, lei } =
        request.body
      

      try {
        await companyService.upsertCompany({
          name,
          wikidataId,
          internalComment,
          tags,
          url,
          lei,
        })
      } catch(error) {
        console.error('ERROR Creation or update of company failed:', error)
        return reply.status(500).send({message: "Creation or update of company failed."});
      }

      return reply.send({ ok: true })
    }
  ),
  app.post(
    '/:wikidataId/descriptions',
    {
      schema: {
        summary: 'Create or update company descriptions',
        description:
          'Creates new company descriptions or updates existing ones based on description id',
        tags: getTags('Companies', 'CompanyDescription'),
        body: postDescriptionsBodySchema,
        response: {
          200: okResponseSchema,
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (request: AuthenticatedFastifyRequest<{
      Params: WikidataIdParams,
      Body: PostDescriptionsBody
    }>, reply) => {
      const { descriptions, metadata } = request.body
      descriptions.map(
        async (description) => {
          const createdMetadata = await metadataService.createMetadata({
            user: request.user,
            metadata: {
              source: metadata?.source,
              comment: metadata?.comment,
            }
          })
          await companyService.upsertDescription({
            description,
            metadata: createdMetadata
          })
        }
      )
      
      reply.send({ok: true})
    }
  )

}
