import { FastifyInstance, FastifyRequest } from 'fastify'

import { getGics } from '../../lib/gics'
import { prisma } from '../../lib/prisma'
import { getTags } from '../../config/openapi'
import { WikidataIdParams } from '../types'
import { cachePlugin } from '../plugins/cache'
import { companyListArgs, detailedCompanyArgs } from '../args'
import {
  CompanyList,
  wikidataIdParamSchema,
  CompanyDetails,
  getErrorSchemas,
} from '../schemas'
import { eTagCache } from '../..'

function isNumber(n: unknown): n is number {
  return Number.isFinite(n)
}

function transformMetadata(data: any): any {
  if (Array.isArray(data)) {
    return data.map((item) => transformMetadata(item))
  } else if (data && typeof data === 'object') {
    const transformed = Object.entries(data).reduce((acc, [key, value]) => {
      if (key === 'metadata' && Array.isArray(value)) {
        acc[key] = value[0] || null
      } else if (value instanceof Date) {
        acc[key] = value
      } else if (typeof value === 'object' && value !== null) {
        acc[key] = transformMetadata(value)
      } else {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, any>)

    return transformed
  }
  return data
}

function addCalculatedTotalEmissions(companies: any[]) {
  return (
    companies
      // Calculate total emissions for each scope type
      .map((company) => ({
        ...company,
        reportingPeriods: company.reportingPeriods.map((reportingPeriod) => ({
          ...reportingPeriod,
          emissions: reportingPeriod.emissions
            ? {
                ...reportingPeriod.emissions,
                scope2:
                  (reportingPeriod.emissions?.scope2 && {
                    ...reportingPeriod.emissions.scope2,
                    calculatedTotalEmissions:
                      reportingPeriod.emissions.scope2.mb ??
                      reportingPeriod.emissions.scope2.lb ??
                      reportingPeriod.emissions.scope2.unknown,
                  }) ||
                  null,
                scope3:
                  (reportingPeriod.emissions?.scope3 && {
                    ...reportingPeriod.emissions.scope3,
                    calculatedTotalEmissions:
                      reportingPeriod.emissions.scope3.categories.some((c) =>
                        Boolean(c.metadata?.verifiedBy)
                      )
                        ? reportingPeriod.emissions.scope3.categories.reduce(
                            (total, category) =>
                              isNumber(category.total)
                                ? category.total + total
                                : total,
                            0
                          )
                        : reportingPeriod.emissions.scope3.statedTotalEmissions
                            ?.total ?? 0,
                  }) ||
                  null,
              }
            : null,
          metadata: reportingPeriod.metadata,
        })),
      }))
      // Calculate total emissions for each reporting period
      // This allows comparing against the statedTotalEmissions provided by the company report
      // In cases where we find discrepancies between the statedTotalEmissions and the actual total emissions,
      // we should highlight this in the UI.
      .map((company) => ({
        ...company,
        reportingPeriods: company.reportingPeriods.map((reportingPeriod) => ({
          ...reportingPeriod,
          emissions: reportingPeriod.emissions
            ? {
                ...reportingPeriod.emissions,
                calculatedTotalEmissions:
                  // If either scope 1 and scope 2 have verification, then we use them for the total.
                  // Otherwise, we use the combined scope1And2 if it exists
                  (Boolean(
                    reportingPeriod.emissions?.scope1?.metadata?.verifiedBy
                  ) ||
                  Boolean(
                    reportingPeriod.emissions?.scope2?.metadata?.verifiedBy
                  )
                    ? (reportingPeriod.emissions?.scope1?.total || 0) +
                      (reportingPeriod.emissions?.scope2
                        ?.calculatedTotalEmissions || 0)
                    : reportingPeriod.emissions?.scope1And2?.total || 0) +
                  (reportingPeriod.emissions?.scope3
                    ?.calculatedTotalEmissions || 0),
              }
            : null,
        })),
      }))
  )
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
          200: CompanyList,
        },
      },
    },
    async (request, reply) => {
      const clientEtag = request.headers['if-none-match']
      const cacheKey = 'companies:etag'

      let currentEtag = await eTagCache.get(cacheKey)

      const latestMetadata = await prisma.metadata.findFirst({
        select: { updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      })
      const latestMetadataUpdatedAt =
        latestMetadata?.updatedAt.toISOString() || ''

      if (!currentEtag || !currentEtag.startsWith(latestMetadataUpdatedAt)) {
        currentEtag = `${latestMetadataUpdatedAt}-${new Date().toISOString()}`
        eTagCache.set(cacheKey, currentEtag)
      }

      if (clientEtag === currentEtag) return reply.code(304).send()

      reply.header('ETag', `${currentEtag}`)

      const companies = await prisma.company.findMany(companyListArgs)

      const transformedCompanies = addCalculatedTotalEmissions(
        companies.map(transformMetadata)
      )

      reply.send(transformedCompanies)
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
          200: CompanyDetails,
          ...getErrorSchemas(400, 404),
        },
      },
    },
    async (request: FastifyRequest<{ Params: WikidataIdParams }>, reply) => {
      const { wikidataId } = request.params

      const company = await prisma.company.findFirstOrThrow({
        ...detailedCompanyArgs,
        where: {
          wikidataId,
        },
      })

      const [transformedCompany] = addCalculatedTotalEmissions([
        transformMetadata(company),
      ])

      reply.send({
        ...transformedCompany,
        // Add translations for GICS data
        industry: transformedCompany.industry
          ? {
              ...transformedCompany.industry,
              industryGics: {
                ...transformedCompany.industry.industryGics,
                ...getGics(
                  transformedCompany.industry.industryGics.subIndustryCode
                ),
              },
            }
          : null,
      })
    }
  )
}
