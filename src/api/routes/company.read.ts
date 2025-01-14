import { FastifyInstance } from 'fastify'

import { getGics } from '../../lib/gics'
// TODO: enable middlewares
// import { cache, enableCors } from '../middlewares/middlewares'
import { GarboAPIError } from '../../lib/garbo-api-error'
import { prisma } from '../../lib/prisma'
import apiConfig from '../../config/api'

import { Prisma } from '@prisma/client'
import { CompanyDetails, CompanyList } from '../../openapi/schemas'
import { z } from 'zod'
import { getTags } from '../../openapi/utils'

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

// TODO: re-enable cors using @fastify/cors
// router.use(enableCors(apiConfig.corsAllowOrigins as unknown as string[]))

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

export const errorMessageSchema = z.object({ message: z.string() })

/**
 * Get common error responses for a list of HTTP status codes.
 */
export function getErrorResponseSchemas(...statusCodes: number[]) {
  return statusCodes.reduce((acc, status) => {
    acc[status] = errorMessageSchema
    return acc
  }, {} as Record<number, z.ZodType>)
}

export async function companyReadRoutes(app: FastifyInstance) {
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
          ...getErrorResponseSchemas(500),
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
                metadata: minimalMetadata,
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

        const transformedCompanies = Array.isArray(companies)
          ? companies.map((company) => transformMetadata(company))
          : transformMetadata(companies)

        reply.send(
          transformedCompanies
            // Calculate total emissions for each scope type
            .map((company) => ({
              ...company,
              reportingPeriods: company.reportingPeriods.map(
                (reportingPeriod) => ({
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
                          ...removeEmptyValues(
                            reportingPeriod.emissions.scope3
                          ),
                          calculatedTotalEmissions:
                            reportingPeriod.emissions.scope3.categories.some(
                              (c) => Boolean(c.metadata?.verifiedBy)
                            )
                              ? reportingPeriod.emissions.scope3.categories.reduce(
                                  (total, category) =>
                                    isNumber(category.total)
                                      ? category.total + total
                                      : total,
                                  0
                                )
                              : reportingPeriod.emissions.scope3
                                  .statedTotalEmissions?.total ?? 0,
                        }) ||
                      undefined,
                  },
                  metadata: reportingPeriod.metadata,
                })
              ),
            }))
            // Calculate total emissions for each reporting period
            // This allows comparing against the statedTotalEmissions provided by the company report
            // In cases where we find discrepancies between the statedTotalEmissions and the actual total emissions,
            // we should highlight this in the UI.
            .map((company) => ({
              ...company,
              reportingPeriods: company.reportingPeriods.map(
                (reportingPeriod) => ({
                  ...reportingPeriod,
                  emissions: Object.keys(
                    removeEmptyValues(reportingPeriod.emissions)
                  ).length
                    ? {
                        ...removeEmptyValues(reportingPeriod.emissions),
                        calculatedTotalEmissions:
                          // If either scope 1 and scope 2 have verification, then we use them for the total.
                          // Otherwise, we use the combined scope1And2 if it exists
                          (Boolean(
                            reportingPeriod.emissions?.scope1?.metadata
                              ?.verifiedBy
                          ) ||
                          Boolean(
                            reportingPeriod.emissions?.scope2?.metadata
                              ?.verifiedBy
                          )
                            ? (reportingPeriod.emissions?.scope1?.total || 0) +
                              (reportingPeriod.emissions?.scope2
                                ?.calculatedTotalEmissions || 0)
                            : reportingPeriod.emissions?.scope1And2?.total ||
                              0) +
                          (reportingPeriod.emissions?.scope3
                            ?.calculatedTotalEmissions || 0),
                      }
                    : null,
                })
              ),
            }))
        )
      } catch (error) {
        throw new GarboAPIError('Failed to load companies', {
          original: error,
          statusCode: 500,
        })
      }
    }
  )
}

/**
 * @swagger
 * /companies/{wikidataId}:
 *   get:
 *     summary: Get a specific company
 *     description: Retrieve detailed information about a specific company
 *     tags: [Companies]
 *     parameters:
 *       - in: path
 *         name: wikidataId
 *         required: true
 *         schema:
 *           type: string
 *         description: Wikidata ID of the company
 *     responses:
 *       200:
 *         description: Company details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CompanyDetails'
 *       404:
 *         description: Company not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/*
router.get(
  '/:wikidataId',
  cache(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { wikidataId } = req.params
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
                  biogenicEmissions: {
                    select: {
                      total: true,
                      unit: true,
                      metadata,
                    },
                  },
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
        return next(new GarboAPIError('Company not found', { statusCode: 404 }))
      }

      const transformedCompany = transformMetadata(company)
      res.json(
        [transformedCompany]
          // Calculate total emissions for each scope type
          .map((company) => ({
            ...company,
            reportingPeriods: company.reportingPeriods.map(
              (reportingPeriod) => ({
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
                          reportingPeriod.emissions.scope3.categories.some(
                            (c) => Boolean(c.metadata?.verifiedBy)
                          )
                            ? reportingPeriod.emissions.scope3.categories.reduce(
                                (total, category) =>
                                  isNumber(category.total)
                                    ? category.total + total
                                    : total,
                                0
                              )
                            : reportingPeriod.emissions.scope3
                                .statedTotalEmissions?.total ?? 0,
                      }) ||
                    undefined,
                },
                metadata: reportingPeriod.metadata,
              })
            ),
            // Add translations for GICS data
            industry: company.industry
              ? {
                  ...company.industry,
                  industryGics: {
                    ...company.industry.industryGics,
                    ...getGics(company.industry.industryGics.subIndustryCode),
                  },
                }
              : undefined,
          }))
          // Calculate total emissions for each reporting period
          // This allows comparing against the statedTotalEmissions provided by the company report
          // In cases where we find discrepancies between the statedTotalEmissions and the actual total emissions,
          // we should highlight this in the UI.
          .map((company) => ({
            ...company,
            reportingPeriods: company.reportingPeriods.map(
              (reportingPeriod) => ({
                ...reportingPeriod,
                emissions: Object.keys(
                  removeEmptyValues(reportingPeriod.emissions)
                ).length
                  ? {
                      ...removeEmptyValues(reportingPeriod.emissions),
                      calculatedTotalEmissions:
                        // if either scope 1 and scope 2 have verification, then we use them for the total.
                        // Otherwise, we use the combined scope1And2 if it exists
                        (Boolean(
                          reportingPeriod.emissions?.scope1?.metadata
                            ?.verifiedBy
                        ) ||
                        Boolean(
                          reportingPeriod.emissions?.scope2?.metadata
                            ?.verifiedBy
                        )
                          ? (reportingPeriod.emissions?.scope1?.total || 0) +
                            (reportingPeriod.emissions?.scope2
                              ?.calculatedTotalEmissions || 0)
                          : reportingPeriod.emissions?.scope1And2?.total || 0) +
                        (reportingPeriod.emissions?.scope3
                          ?.calculatedTotalEmissions || 0),
                    }
                  : null,
              })
            ),
          }))
          .at(0)
      )
    } catch (error) {
      if (error instanceof Prisma.PrismaClientValidationError) {
        next(
          new GarboAPIError('Invalid company data format', {
            original: error,
            statusCode: 422,
          })
        )
      } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
        next(
          new GarboAPIError('Database error while loading company', {
            original: error,
            statusCode: 500,
          })
        )
      } else {
        next(
          new GarboAPIError('Failed to load company', {
            original: error,
            statusCode: 500,
          })
        )
      }
    }
  }
)

export default router
*/
