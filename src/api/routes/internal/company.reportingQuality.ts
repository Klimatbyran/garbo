import { FastifyInstance, AuthenticatedFastifyRequest } from 'fastify'

import { reportingQualityService } from '../../services/reportingQualityService'
import { companyService } from '../../services/companyService'
import {
  companyIdParamSchema,
  okResponseSchema,
  getErrorSchemas,
  postReportingQualitySchema,
} from '../../schemas'
import { CompanyIdParams } from '../../types'
import { getTags } from '../../../config/openapi'
import { z } from 'zod'

type PostReportingQualityBody = z.infer<typeof postReportingQualitySchema>

export async function companyReportingQualityRoutes(app: FastifyInstance) {
  app.post(
    '/:id/reporting-quality',
    {
      schema: {
        summary: 'Upsert reporting quality for a company report',
        tags: getTags('Internal'),
        params: companyIdParamSchema,
        body: postReportingQualitySchema,
        response: {
          200: okResponseSchema,
          ...getErrorSchemas(400, 404, 500),
        },
      },
    },
    async (
      request: AuthenticatedFastifyRequest<{
        Params: CompanyIdParams
        Body: PostReportingQualityBody
      }>,
      reply
    ) => {
      const { id } = request.params
      const {
        url,
        usesGhgProtocolCategories,
        categoryLabelsExample,
        methodChanges,
        missingScopesExplained,
        missingScopesReason,
        scope2MethodExplicit,
        scope1FragmentedReporting,
        scope1FragmentedExample,
        scope2FragmentedReporting,
        scope2FragmentedExample,
        scope3CategoryFragmentation,
      } = request.body

      try {
        const company = await companyService.getCompanyByInternalId(id)
        await reportingQualityService.upsert(company.id, {
          url,
          usesGhgProtocolCategories,
          categoryLabelsExample,
          methodChanges,
          missingScopesExplained,
          missingScopesReason,
          scope2MethodExplicit,
          scope1FragmentedReporting,
          scope1FragmentedExample,
          scope2FragmentedReporting,
          scope2FragmentedExample,
          scope3CategoryFragmentation,
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
