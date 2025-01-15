import { FastifyInstance, FastifyRequest } from 'fastify'
import { Prisma } from '@prisma/client'

import { getGics } from '../../lib/gics'
import { GarboAPIError } from '../../lib/garbo-api-error'
import { prisma } from '../../lib/prisma'
import { getTags } from '../../config/openapi'
import {
  getErrorResponseSchemas,
  wikidataIdParamSchema,
  CompanyList,
  CompanyDetails,
} from '../schemas'
import { WikidataIdParams } from '../types'
import { cachePlugin } from '../plugins/cache'

const metadata = {
  orderBy: {
    updatedAt: 'desc' as const,
  },
  take: 1,
  select: {
    comment: true,
    source: true,
    updatedAt: true,
    user: {
      select: {
        name: true,
      },
    },
    verifiedBy: {
      select: {
        name: true,
      },
    },
  },
}

const minimalMetadata = {
  orderBy: {
    updatedAt: 'desc' as const,
  },
  take: 1,
  select: {
    verifiedBy: {
      select: {
        name: true,
      },
    },
  },
}

function removeEmptyValues(obj: Record<any, any>) {
  return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v != null))
}

function isNumber(n: unknown): n is number {
  return Number.isFinite(n)
}

function transformMetadata(data: any): any {
  if (Array.isArray(data)) {
    return data.map((item) => transformMetadata(item))
  } else if (data && typeof data === 'object') {
    return Object.entries(data).reduce((acc, [key, value]) => {
      if (key === 'metadata' && Array.isArray(value)) {
        acc[key] = value[0] || null
      } else if (value instanceof Date) {
        // Leave Date fields untouched
        acc[key] = value
      } else if (typeof value === 'object' && value !== null) {
        acc[key] = transformMetadata(value)
      } else {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, any>)
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
          emissions: {
            ...reportingPeriod.emissions,
            scope2:
              (reportingPeriod.emissions?.scope2 && {
                ...reportingPeriod.emissions.scope2,
                calculatedTotalEmissions:
                  reportingPeriod.emissions.scope2.mb ??
                  reportingPeriod.emissions.scope2.lb ??
                  reportingPeriod.emissions.scope2.unknown,
              }) ||
              undefined,
            scope3:
              (reportingPeriod.emissions?.scope3 &&
                Object.keys(
                  removeEmptyValues(reportingPeriod.emissions?.scope3)
                ).length && {
                  ...removeEmptyValues(reportingPeriod.emissions.scope3),
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
              undefined,
          },
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
          emissions: reportingPeriod.emissions.length
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
          // ...getErrorResponseSchemas(500),
        },
      },
    },
    async (request, reply) => {
      try {
        const companies = await prisma.company.findMany({
          select: {
            wikidataId: true,
            name: true,
            description: true,
            reportingPeriods: {
              select: {
                startDate: true,
                endDate: true,
                reportURL: true,
                economy: {
                  select: {
                    turnover: {
                      select: {
                        value: true,
                        currency: true,
                        metadata: minimalMetadata,
                      },
                    },
                    employees: {
                      select: {
                        value: true,
                        unit: true,
                        metadata: minimalMetadata,
                      },
                    },
                  },
                },
                emissions: {
                  select: {
                    scope1: {
                      select: {
                        total: true,
                        unit: true,
                        metadata: minimalMetadata,
                      },
                    },
                    scope2: {
                      select: {
                        lb: true,
                        mb: true,
                        unknown: true,
                        unit: true,
                        metadata: minimalMetadata,
                      },
                    },
                    scope3: {
                      select: {
                        statedTotalEmissions: {
                          select: {
                            total: true,
                            unit: true,
                            metadata: minimalMetadata,
                          },
                        },
                        categories: {
                          select: {
                            category: true,
                            total: true,
                            unit: true,
                            metadata: minimalMetadata,
                          },
                          orderBy: {
                            category: 'asc',
                          },
                        },
                        metadata: minimalMetadata,
                      },
                    },
                    biogenicEmissions: {
                      select: {
                        total: true,
                        unit: true,
                        metadata: minimalMetadata,
                      },
                    },
                    scope1And2: {
                      select: {
                        total: true,
                        unit: true,
                        metadata: minimalMetadata,
                      },
                    },
                    statedTotalEmissions: {
                      select: {
                        total: true,
                        unit: true,
                        metadata,
                      },
                    },
                  },
                },
              },
              orderBy: {
                startDate: 'desc',
              },
            },
            industry: {
              select: {
                industryGics: {
                  select: {
                    sectorCode: true,
                    groupCode: true,
                    industryCode: true,
                    subIndustryCode: true,
                  },
                },
                metadata: minimalMetadata,
              },
            },
          },
        })

        const transformedCompanies = addCalculatedTotalEmissions(
          companies.map(transformMetadata)
        )

        reply.send(transformedCompanies)
      } catch (error) {
        throw new GarboAPIError('Failed to load companies', {
          original: error,
          statusCode: 500,
        })
      }
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
          // ...getErrorResponseSchemas(404, 500),
        },
      },
    },
    async (request: FastifyRequest<{ Params: WikidataIdParams }>, reply) => {
      try {
        const { wikidataId } = request.params
        const company = await prisma.company.findFirst({
          where: {
            wikidataId,
          },
          select: {
            wikidataId: true,
            name: true,
            description: true,
            reportingPeriods: {
              select: {
                startDate: true,
                endDate: true,
                reportURL: true,
                economy: {
                  select: {
                    turnover: {
                      select: {
                        value: true,
                        currency: true,
                        metadata,
                      },
                    },
                    employees: {
                      select: {
                        value: true,
                        unit: true,
                        metadata,
                      },
                    },
                  },
                },
                emissions: {
                  select: {
                    scope1: {
                      select: {
                        total: true,
                        unit: true,
                        metadata,
                      },
                    },
                    scope2: {
                      select: {
                        lb: true,
                        mb: true,
                        unknown: true,
                        unit: true,
                        metadata,
                      },
                    },
                    scope3: {
                      select: {
                        statedTotalEmissions: {
                          select: {
                            total: true,
                            unit: true,
                            metadata,
                          },
                        },
                        categories: {
                          select: {
                            category: true,
                            total: true,
                            unit: true,
                            metadata,
                          },
                          orderBy: {
                            category: 'asc',
                          },
                        },
                        metadata,
                      },
                    },
                    biogenicEmissions: true,
                    scope1And2: {
                      select: {
                        total: true,
                        unit: true,
                        metadata,
                      },
                    },
                    statedTotalEmissions: {
                      select: {
                        total: true,
                        unit: true,
                        metadata,
                      },
                    },
                  },
                },
                metadata,
              },
              orderBy: {
                startDate: 'desc',
              },
            },
            industry: {
              select: {
                industryGics: {
                  select: {
                    sectorCode: true,
                    groupCode: true,
                    industryCode: true,
                    subIndustryCode: true,
                  },
                },
                metadata,
              },
            },
            goals: {
              select: {
                id: true,
                description: true,
                year: true,
                baseYear: true,
                target: true,
                metadata,
              },
              orderBy: {
                year: 'desc',
              },
            },
            initiatives: {
              select: {
                id: true,
                title: true,
                description: true,
                year: true,
                scope: true,
                metadata,
              },
              orderBy: {
                year: 'desc',
              },
            },
          },
        })

        if (!company) {
          throw new GarboAPIError('Company not found', { statusCode: 404 })
        }
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
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          throw new GarboAPIError('Database error while loading company', {
            original: error,
            statusCode: 500,
          })
        } else {
          throw new GarboAPIError('Failed to load company', {
            original: error,
            statusCode: 500,
          })
        }
      }
    }
  )
}
