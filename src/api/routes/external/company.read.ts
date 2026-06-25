import { FastifyInstance, FastifyRequest } from 'fastify'

import { getGics } from '../../../lib/gics'
import { prisma } from '../../../lib/prisma'
import { getTags } from '../../../config/openapi'
import { CompanySearchQuery, WikidataIdParams } from '../../types'
import { cachePlugin } from '../../plugins/cache'
import { companyService } from '../../services/companyService'
import {
  toPartnerCompanyList,
  toPartnerCompanyResponse,
} from '../../services/reportingPeriodPublicRead'
import {
  PartnerCompanyList,
  wikidataIdParamSchema,
  PartnerCompanyDetails,
  getErrorSchemas,
  companySearchQuerySchema,
  CompanyKpiListSchema,
} from '../../schemas'
import { redisCache } from '../../../lib/redisCacheSingleton'

async function getCompaniesDatabaseFingerprint() {
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

  return [
    companyCount,
    reportingPeriodCount,
    companyReportCount,
    emissionsCount,
    latestMetadata?.updatedAt?.toISOString() || '',
    latestCompanyReport?.createdAt?.toISOString() || '',
  ].join('|')
}

async function getOrRefreshCompaniesEtag(databaseFingerprint: string) {
  const cacheKey = 'companies:etag'
  let currentEtag: string = await redisCache.get(cacheKey)

  if (!currentEtag || !currentEtag.startsWith(databaseFingerprint)) {
    currentEtag = `${databaseFingerprint}-${new Date().toISOString()}`
    await redisCache.set(cacheKey, JSON.stringify(currentEtag))
  }

  return currentEtag
}

export async function companyReadRoutes(app: FastifyInstance) {
  app.register(cachePlugin)

  app.get(
    '/',
    {
      schema: {
        summary: 'Get all companies',
        description:
          'Retrieve a list of all companies with their emissions, economic data, industry classification, goals, and initiatives',
        tags: getTags('Companies'),

        response: {
          200: PartnerCompanyList,
        },
      },
    },

    async (request, reply) => {
      const databaseFingerprint = await getCompaniesDatabaseFingerprint()
      const currentEtag = await getOrRefreshCompaniesEtag(databaseFingerprint)

      const dataCacheKey = `companies:data:${databaseFingerprint}`

      let companies = await redisCache.get(dataCacheKey)

      if (!companies) {
        companies = await companyService.getAllCompaniesForPublicRead()
        await redisCache.set(dataCacheKey, JSON.stringify(companies))
      }

      reply.header('ETag', `${currentEtag}`)

      reply.send(toPartnerCompanyList(companies))
    }
  )

  app.get(
    '/kpis',
    {
      schema: {
        summary: 'Get company KPIs',
        description:
          'Retrieve key performance indicators for all companies, including Paris agreement compliance and emissions change from base year.',
        tags: getTags('Companies'),
        response: {
          200: CompanyKpiListSchema,
        },
      },
    },
    async (_request, reply) => {
      const databaseFingerprint = await getCompaniesDatabaseFingerprint()
      const currentEtag = await getOrRefreshCompaniesEtag(databaseFingerprint)

      const dataCacheKey = `companies:kpis:${databaseFingerprint}`

      let kpis = await redisCache.get(dataCacheKey)

      if (!kpis) {
        kpis = await companyService.getCompanyKpis()
        await redisCache.set(dataCacheKey, JSON.stringify(kpis))
      }

      reply.header('ETag', `${currentEtag}`)

      reply.send(kpis)
    }
  )

  // Register before /:wikidataId so "search" is not captured as an id
  app.get(
    '/search',
    {
      schema: {
        summary: 'Search for companies',
        description:
          'Search for a company with its emissions, economic data, industry classification, goals, and initiatives',
        tags: getTags('Companies'),
        querystring: companySearchQuerySchema,
        response: {
          200: PartnerCompanyList,
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: CompanySearchQuery }>,
      reply
    ) => {
      const { q } = request.query
      const companies = await companyService.getAllCompaniesBySearchTerm(q, {
        onePeriodPerDataYear: true,
      })
      reply.send(toPartnerCompanyList(companies))
    }
  )

  app.get(
    '/:wikidataId',
    {
      schema: {
        summary: 'Get detailed company',
        description:
          'Retrieve a company with its emissions, economic data, industry classification, goals, and initiatives',
        tags: getTags('Companies'),
        params: wikidataIdParamSchema,
        response: {
          200: PartnerCompanyDetails,
          ...getErrorSchemas(400, 404),
        },
      },
    },
    async (request: FastifyRequest<{ Params: WikidataIdParams }>, reply) => {
      const { wikidataId } = request.params
      const company = await companyService.getCompanyForPublicRead(wikidataId)
      reply.send(
        toPartnerCompanyResponse({
          ...company,
          // Add translations for GICS data
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
      )
    }
  )
}
