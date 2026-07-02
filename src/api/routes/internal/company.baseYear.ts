import { FastifyInstance, AuthenticatedFastifyRequest } from 'fastify'

import { baseYearService } from '../../services/baseYearService'
import { companyService } from '../../services/companyService'
import {
  companyIdParamSchema,
  okResponseSchema,
  getErrorSchemas,
  postBaseYear,
} from '../../schemas'
import { PostBaseYearBody, CompanyIdParams } from '../../types'
import { metadataService } from '../../services/metadataService'
import { getTags } from '../../../config/openapi'

export async function companyBaseYearRoutes(app: FastifyInstance) {
  app.post(
    '/:id/base-year',
    {
      schema: {
        summary: 'Upsert company base year',
        description: 'Upsert the base year for a company',
        tags: getTags('BaseYear'),
        params: companyIdParamSchema,
        body: postBaseYear,
        response: {
          200: okResponseSchema,
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Params: CompanyIdParams
        Body: PostBaseYearBody
      }>,
      reply
    ) => {
      const { id } = request.params
      const { baseYear, metadata, verified } = request.body

      const createdMetadata = await metadataService.createMetadata({
        metadata,
        user: request.user,
        verified,
      })

      try {
        const company = await companyService.getCompanyByInternalId(id)
        await baseYearService.upsertBaseYear(
          company.id,
          baseYear,
          createdMetadata
        )
      } catch (error) {
        console.error('ERROR Creation or update of base year failed:', error)
        return reply
          .status(500)
          .send({ message: 'Creation or update of base year failed' })
      }

      return reply.send({ ok: true })
    }
  )
}
