import { FastifyInstance, AuthenticatedFastifyRequest } from 'fastify'

import { industryService } from '../../services/industryService'
import { companyService } from '../../services/companyService'
import { getErrorSchemas, postIndustrySchema } from '../../schemas'
import { metadataService } from '../../services/metadataService'
import { getTags } from '../../../config/openapi'
import { companyIdParamSchema, okResponseSchema } from '../../schemas'
import { CompanyIdParams, PostIndustryBody } from '../../types'

export async function companyIndustryRoutes(app: FastifyInstance) {
  app.post(
    '/:id/industry',
    {
      schema: {
        summary: 'Update company industry',
        description:
          'Update or create industry classification for a company based on the GICS standard',
        tags: getTags('Industry'),
        params: companyIdParamSchema,
        body: postIndustrySchema,
        response: {
          200: okResponseSchema,
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Params: CompanyIdParams
        Body: PostIndustryBody
      }>,
      reply
    ) => {
      const {
        industry: { subIndustryCode },
        metadata,
        verified,
      } = request.body
      const { id } = request.params

      const createdMetadata = await metadataService.createMetadata({
        metadata,
        user: request.user,
        verified,
      })

      try {
        const company = await companyService.getCompanyByInternalId(id)
        await industryService.upsertIndustry(
          company.id,
          { subIndustryCode },
          createdMetadata
        )
      } catch (error) {
        console.error('ERROR Creation or update of industry failed:', error)
        return reply.status(500).send({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Creation or update of industry failed.',
        })
      }

      return reply.send({ ok: true })
    }
  )
}
