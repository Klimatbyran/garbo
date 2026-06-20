import { FastifyInstance, FastifyRequest } from 'fastify'

import { getGics } from '../../../lib/gics'
import { prisma } from '../../../lib/prisma'
import { companyService } from '../../services/companyService'
import {
  CompanyList,
  getErrorSchemas,
  InternalCompanyDetails,
  wikidataIdParamSchema,
} from '../../schemas'
import { getTags } from '../../../config/openapi'
import { WikidataIdParams } from '../../types'
import { cachePlugin } from '../../plugins/cache'
import { redisCache } from '../../../lib/redisCacheSingleton'

/**
 * Staff JWT routes for validate and pipeline workers. Full reporting period rows
 * (not the one-period-per-data-year effective read used on client APIs).
 */
export async function pipelineCompanyReadRoutes(app: FastifyInstance) {
  app.register(cachePlugin)

  app.get(
    '/',
    {
      schema: {
        summary: 'List companies with all reporting periods (pipeline)',
        description:
          'Staff list for validate and pipeline tooling. Includes every reporting period row per company (not the public one-period-per-data-year view).',
        tags: getTags('Internal'),
        response: {
          200: CompanyList,
        },
      },
    },
    async (request, reply) => {
      const cacheKey = 'pipeline-companies:etag'

      let currentEtag: string = await redisCache.get(cacheKey)

      const [
        companyCount,
        reportingPeriodCount,
        companyReportCount,
        emissionsCount,
        latestMetadata,
        latestCompanyReport,
      ] = await prisma.$transaction([
        prisma.company.count(),
        prisma.reportingPeriod.count(),
        prisma.companyReport.count(),
        prisma.emissions.count(),
        prisma.metadata.findFirst({
          select: { updatedAt: true },
          orderBy: { updatedAt: 'desc' },
        }),
        prisma.companyReport.findFirst({
          select: { createdAt: true },
          orderBy: { createdAt: 'desc' },
        }),
      ])

      const databaseFingerprint = [
        companyCount,
        reportingPeriodCount,
        companyReportCount,
        emissionsCount,
        latestMetadata?.updatedAt?.toISOString() || '',
        latestCompanyReport?.createdAt?.toISOString() || '',
      ].join('|')

      if (!currentEtag || !currentEtag.startsWith(databaseFingerprint)) {
        currentEtag = `${databaseFingerprint}-${new Date().toISOString()}`
        await redisCache.set(cacheKey, JSON.stringify(currentEtag))
      }

      const dataCacheKey = `pipeline-companies:data:${databaseFingerprint}`

      let companies = await redisCache.get(dataCacheKey)

      if (!companies) {
        companies = await companyService.getAllCompaniesWithMetadata()
        await redisCache.set(dataCacheKey, JSON.stringify(companies))
      }

      reply.header('ETag', `${currentEtag}`)
      reply.send(companies)
    }
  )

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
