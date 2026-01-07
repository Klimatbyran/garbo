import { FastifyInstance, AuthenticatedFastifyRequest } from 'fastify'

import { prisma } from '../../lib/prisma'
import { industryService } from '../services/industryService'
import { getErrorSchemas, postIndustrySchema } from '../schemas'
import { metadataService } from '../services/metadataService'
import { getTags } from '../../config/openapi'
import { wikidataIdParamSchema, okResponseSchema } from '../schemas'
import { WikidataIdParams, PostIndustryBody } from '../types'

export async function companyIndustryRoutes(app: FastifyInstance) {
  app.post(
    '/:wikidataId/industry',
    {
      schema: {
        summary: 'Update company industry',
        description:
          'Update or create industry classification for a company based on the GICS standard',
        tags: getTags('Industry'),
        params: wikidataIdParamSchema,
        body: postIndustrySchema,
        response: {
          200: okResponseSchema,
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Params: WikidataIdParams
        Body: PostIndustryBody
      }>,
      reply
    ) => {
      const {
        industry: { subIndustryCode },
        metadata,
        verified,
      } = request.body
      const { wikidataId } = request.params

      const createdMetadata = await metadataService.createMetadata({
        metadata,
        user: request.user,
        verified,
      })

      try {
        await industryService.upsertIndustry(
          wikidataId,
          { subIndustryCode },
          createdMetadata
        )
      } catch (error) {
        console.error('ERROR Creation or update of industry failed:', error)
        return reply
          .status(500)
          .send({ message: 'Creation or update of industry failed.' })
      }

      return reply.send({ ok: true })
    }
  )
}
