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
  InternalCompanyDetails,
  getErrorSchemas,
  companySearchQuerySchema,
  ReportsCompanyList,
  previewQuerySchema,
  errorResponseSchema,
  previewResponseSchema,
} from '../../schemas'
import { redisCache } from '../../../lib/redisCacheSingleton'

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
    }
  )

  app.get(
    '/search',
    {
      schema: {
        summary: 'Search for companies',
        description:
          'Search for a company with its emissions, economic data, industry classification, goals, and initiatives',
        tags: getTags('Internal'),
        querystring: companySearchQuerySchema,
        response: {
          200: CompanyList,
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: CompanySearchQuery }>,
      reply
    ) => {
      const { q } = request.query
      const companies = await companyService.getAllCompaniesBySearchTerm(q)
      reply.send(companies)
    }
  )
  app.get(
    '/reports/database-list',
    {
      schema: {
        summary:
          'Get list of all companies in the database with reporting periods for crawler purposes.',
        description:
          'Retrieve a list of all companies in the database, including their names and Wikidata IDs and reporting periods.',
        tags: getTags('Internal'),
        response: {
          200: ReportsCompanyList,
        },
      },
    },
    async (request, reply) => {
      const companies = await companyService.getAllCompanies()
      reply.send(companies || [])
    }
  )

  app.get(
    '/reports/preview',
    {
      schema: {
        summary: 'Generate preview image from PDF URL',
        description:
          'Returns a preview image (JPEG) from the first page of the given PDF URL.',
        tags: getTags('Internal'),
        querystring: previewQuerySchema,
        response: {
          200: previewResponseSchema,
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { pdfUrl } = request.query as { pdfUrl: string }
      const jpegBuffer = await companyService.generateReportPreview(pdfUrl)
      if (!jpegBuffer) {
        reply.status(400).send({ message: 'Failed to generate preview.' })
        return
      }

      reply.header('Content-Type', 'image/jpeg')
      return reply.send(jpegBuffer)
    }
  )

  app.get(
    '/:wikidataId',
    {
      schema: {
        summary: 'Get detailed company',
        description:
          'Retrieve a company with its emissions, economic data, industry classification, goals, and initiatives',
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
    }
  )
}
