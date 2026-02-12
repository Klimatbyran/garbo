import { FastifyInstance, FastifyRequest } from 'fastify'

import { getGics } from '../../../lib/gics'
import { prisma } from '../../../lib/prisma'
import { getTags } from '../../../config/openapi'
import { CompanySearchQuery, WikidataIdParams } from '../../types'
import { cachePlugin } from '../../plugins/cache'
import { companyService } from '../../services/companyService'
import {
  CompanyList,
  wikidataIdParamSchema,
  CompanyDetails,
  getErrorSchemas,
  companySearchQuerySchema,
} from '../../schemas'
import { redisCache } from '../../..'

export async function internalCompanyReadRoutes(app: FastifyInstance) {
  app.register(cachePlugin)

  app.get(
    '/',
    {
      schema: {
        summary: 'Get all companies',
        description:
          'Retrieve a list of all companies with their emissions, economic data, industry classification, goals, and initiatives',
        tags: getTags('Internal'),

        response: {
          200: CompanyList,
        },
      },
    },

    async (request, reply) => {
      const cacheKey = 'companies:etag'

      let currentEtag: string = await redisCache.get(cacheKey)

      // Check for database changes by looking at record counts across relevant tables
      const [
        companyCount,
        reportingPeriodCount,
        emissionsCount,
        latestMetadata,
      ] = await prisma.$transaction([
        prisma.company.count(),
        prisma.reportingPeriod.count(),
        prisma.emissions.count(),
        prisma.metadata.findFirst({
          select: { updatedAt: true },
          orderBy: { updatedAt: 'desc' },
        }),
      ])

      // Create a unique fingerprint based on company data
      const databaseFingerprint = [
        companyCount,
        reportingPeriodCount,
        emissionsCount,
        latestMetadata?.updatedAt?.toISOString() || '',
      ].join('|')

      if (!currentEtag || !currentEtag.startsWith(databaseFingerprint)) {
        currentEtag = `${databaseFingerprint}-${new Date().toISOString()}`
        await redisCache.set(cacheKey, JSON.stringify(currentEtag))
      }

      const dataCacheKey = `companies:data:${databaseFingerprint}`

      let companies = await redisCache.get(dataCacheKey)

      if (!companies) {
        companies = await companyService.getAllCompaniesWithMetadata()
        await redisCache.set(dataCacheKey, JSON.stringify(companies))
      }

      reply.header('ETag', `${currentEtag}`)

      reply.send(companies)
    },
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
          200: CompanyDetails,
          ...getErrorSchemas(400, 404),
        },
      },
    },
    async (request: FastifyRequest<{ Params: WikidataIdParams }>, reply) => {
      const { wikidataId } = request.params
      const company = await companyService.getCompanyWithMetadata(wikidataId)
      reply.send({
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
    },
  )

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
          200: CompanyList,
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: CompanySearchQuery }>,
      reply,
    ) => {
      const { q } = request.query
      const companies = await companyService.getAllCompaniesBySearchTerm(q)
      console.log(companies)
      reply.send(companies)
    },
  )
}
