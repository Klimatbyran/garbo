import { FastifyInstance, AuthenticatedFastifyRequest } from 'fastify'

import { reportingQualityService } from '../../services/reportingQualityService'
import {
  wikidataIdParamSchema,
  okResponseSchema,
  getErrorSchemas,
  postReportingQualitySchema,
} from '../../schemas'
import { WikidataIdParams } from '../../types'
import { getTags } from '../../../config/openapi'
import { z } from 'zod'

type PostReportingQualityBody = z.infer<typeof postReportingQualitySchema>

export async function companyReportingQualityRoutes(app: FastifyInstance) {
  app.post(
    '/:wikidataId/reporting-quality',
    {
      schema: {
        summary: 'Upsert reporting quality for a company report',
        tags: getTags('Internal'),
        params: wikidataIdParamSchema,
        body: postReportingQualitySchema,
        response: {
          200: okResponseSchema,
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Params: WikidataIdParams
        Body: PostReportingQualityBody
      }>,
      reply
    ) => {
      const { wikidataId } = request.params
      const {
        url,
        usesGhgProtocolCategories,
        methodChanges,
        missingScopesExplained,
      } = request.body

      try {
        await reportingQualityService.upsert(wikidataId, {
          url,
          usesGhgProtocolCategories,
          methodChanges,
          missingScopesExplained,
        })
      } catch (error) {
        console.error('ERROR Upsert of reporting quality failed:', error)
        return reply
          .status(500)
          .send({ message: 'Upsert of reporting quality failed' })
      }

      return reply.send({ ok: true })
    }
  )
}
