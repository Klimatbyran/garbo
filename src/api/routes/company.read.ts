import { FastifyInstance, FastifyRequest } from 'fastify'

import { getGics } from '../../lib/gics'
import { prisma } from '../../lib/prisma'
import { getTags } from '../../config/openapi'
import {
  CompanySearchQuery,
  WikidataIdParams,
  CompanyExpandedQuery,
} from '../types'
import { cachePlugin } from '../plugins/cache'
import {
  companyService,
  transformCompaniesWithAnalysis,
} from '../services/companyService'
import {
  CompanyList,
  wikidataIdParamSchema,
  CompanyDetails,
  getErrorSchemas,
  companySearchQuerySchema,
  companyExpandedQuerySchema,
} from '../schemas'
import { redisCache } from '../..'

export async function companyReadRoutes(app: FastifyInstance) {
  app.register(cachePlugin)

  app.get(
    '/',
    {
      schema: {
        summary: 'Get all companies',
        description:
          'Retrieve a list of all companies with their emissions, economic data, industry classification, goals, and initiatives. Use ?expanded=true to get additional nested analysis data (futureEmissionsTrendSlope, meetsParisGoal, etc.)',
        tags: getTags('Companies'),
        querystring: companyExpandedQuerySchema,
        response: {
          200: CompanyList,
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: CompanyExpandedQuery }>,
      reply,
    ) => {
      const clientEtag = request.headers['if-none-match']
      const cacheKey = 'companies:etag'

      let currentEtag: string = await redisCache.get(cacheKey)

      const latestMetadata = await prisma.metadata.findFirst({
        select: { updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      })
      const latestMetadataUpdatedAt =
        latestMetadata?.updatedAt.toISOString() || ''

      if (!currentEtag || !currentEtag.startsWith(latestMetadataUpdatedAt)) {
        currentEtag = `${latestMetadataUpdatedAt}-${new Date().toISOString()}`
        redisCache.set(cacheKey, JSON.stringify(currentEtag))
      }

      if (clientEtag === currentEtag) return reply.code(304).send()

      const includeAnalysis = request.query.expanded === true
      const dataCacheKey = `companies:data:${latestMetadataUpdatedAt}`
      const analysisCacheKey = `companies:data:analysis:${latestMetadataUpdatedAt}`

      let companies = await redisCache.get(
        includeAnalysis ? analysisCacheKey : dataCacheKey,
      )

      if (!companies) {
        companies = await companyService.getAllCompaniesWithMetadata()
        await redisCache.set(dataCacheKey, JSON.stringify(companies))
      }

      // Transform based on includeAnalysis
      const transformedCompanies = transformCompaniesWithAnalysis(
        JSON.parse(companies),
        includeAnalysis,
      )

      reply.header('ETag', `${currentEtag}`)

      reply.send(transformedCompanies)
    },
  )

  app.get(
    '/:wikidataId',
    {
      schema: {
        summary: 'Get detailed company',
        description:
          'Retrieve a company with its emissions, economic data, industry classification, goals, and initiatives. Use ?expanded=true to get additional nested analysis data (futureEmissionsTrendSlope, meetsParisGoal, etc.)',
        tags: getTags('Companies'),
        params: wikidataIdParamSchema,
        querystring: companyExpandedQuerySchema,
        response: {
          200: CompanyDetails,
          ...getErrorSchemas(400, 404),
        },
      },
    },
    async (
      request: FastifyRequest<{
        Params: WikidataIdParams
        Querystring: CompanyExpandedQuery
      }>,
      reply,
    ) => {
      const { wikidataId } = request.params
      const includeAnalysis = request.query.expanded === true
      const company = await companyService.getCompanyWithMetadata(wikidataId)

      const [transformedCompany] = transformCompaniesWithAnalysis(
        [company],
        includeAnalysis,
      )

      reply.send({
        ...transformedCompany,
        // Add translations for GICS data
        industry: transformedCompany.industry
          ? {
              ...transformedCompany.industry,
              industryGics: {
                ...transformedCompany.industry.industryGics,
                ...getGics(
                  transformedCompany.industry.industryGics.subIndustryCode,
                ),
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
          'Search for a company with its emissions, economic data, industry classification, goals, and initiatives. Use ?expanded=true to get additional nested analysis data.',
        tags: getTags('Companies'),
        querystring: companySearchQuerySchema.extend(
          companyExpandedQuerySchema.shape,
        ),
        response: {
          200: CompanyList,
        },
      },
    },
    async (
      request: FastifyRequest<{
        Querystring: CompanySearchQuery & CompanyExpandedQuery
      }>,
      reply,
    ) => {
      const { q, expanded } = request.query
      const includeAnalysis = expanded === true
      const companies = await companyService.getAllCompaniesBySearchTerm(q)
      const transformedCompanies = transformCompaniesWithAnalysis(
        companies,
        includeAnalysis,
      )
      reply.send(transformedCompanies)
    },
  )
}
