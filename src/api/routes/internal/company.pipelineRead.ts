import { FastifyInstance, FastifyRequest } from 'fastify'

import { getGics } from '../../../lib/gics'
import { companyService } from '../../services/companyService'
import {
  getErrorSchemas,
  InternalCompanyDetails,
  wikidataIdParamSchema,
} from '../../schemas'
import { getTags } from '../../../config/openapi'
import { WikidataIdParams } from '../../types'

/**
 * Staff JWT routes for Garbo workers (pipeline diff/save). Not exposed on the
 * public client API — full reporting period rows, no effective-read filter.
 */
export async function pipelineCompanyReadRoutes(app: FastifyInstance) {
  app.get(
    '/:wikidataId',
    {
      schema: {
        summary: 'Company with all reporting periods (pipeline)',
        description:
          'Full company payload for pipeline diff and approval. Includes every reporting period row (not the public one-period-per-year view).',
        tags: getTags('Internal'),
        params: wikidataIdParamSchema,
        response: {
          200: InternalCompanyDetails,
          ...getErrorSchemas(400, 404),
        },
      },
    },
    async (request: FastifyRequest<{ Params: WikidataIdParams }>, reply) => {
      const { wikidataId } = request.params
      const company = await companyService.getCompanyWithMetadata(wikidataId)
      reply.send({
        ...company,
        industry: company.industry
          ? {
              ...company.industry,
              industryGics: {
                ...company.industry.industryGics,
                ...getGics(company.industry.industryGics.subIndustryCode),
              },
            }
          : null,
      })
    }
  )
}
