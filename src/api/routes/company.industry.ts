import { FastifyInstance, AuthenticatedFastifyRequest } from 'fastify'

import { prisma } from '../../lib/prisma'
import { GarboAPIError } from '../../lib/garbo-api-error'
import { industryService } from '../services/industryService'
import { postIndustrySchema } from '../schemas'
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
      } = request.body
      const { wikidataId } = request.params

      const current = await prisma.industry.findFirst({
        where: { companyWikidataId: wikidataId },
      })

      const createdMetadata = await metadataService.createMetadata({
        metadata,
        user: request.user,
      })

      if (current) {
        await industryService
          .updateIndustry(wikidataId, { subIndustryCode }, createdMetadata)
          .catch((error) => {
            throw new GarboAPIError('Failed to update industry', {
              original: error,
              statusCode: 500,
            })
          })
      } else {
        await industryService
          .createIndustry(wikidataId, { subIndustryCode }, createdMetadata)
          .catch((error) => {
            throw new GarboAPIError('Failed to create industry', {
              original: error,
              statusCode: 500,
            })
          })
      }

      reply.send({ ok: true })
    }
  )
}
