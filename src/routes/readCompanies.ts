import express, { Request, Response } from 'express'
import { validateRequestParams } from './zod-middleware'

import { getGics } from '../lib/gics'
import { cache, enableCors } from './middlewares'
import { wikidataIdParamSchema } from './companySchemas'
import { prisma } from '../lib/prisma'
import { GarboAPIError } from '../lib/garbo-api-error'

const router = express.Router()

const metadata = {
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
    dataOrigin: true,
  },
}

router.use(
  enableCors(['https://beta.klimatkollen.se', 'https://klimatkollen.se'])
)

// TODO: Find a way to de-duplicate the logic so we select the same properties both for GET /companies and GET /companies/:wikidataId
// TODO: Find a way to re-use the same logic to process companies both for GET /companies and GET /companies/:wikidataId

router.get('/', cache(), async (req: Request, res: Response) => {
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
                    scope3Categories: {
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
    res.json(
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
                    reportingPeriod.emissions.scope2.mb ||
                    reportingPeriod.emissions.scope2.lb ||
                    reportingPeriod.emissions.scope2.unknown,
                }) ||
                undefined,
              scope3:
                (reportingPeriod.emissions?.scope3 && {
                  ...reportingPeriod.emissions.scope3,
                  calculatedTotalEmissions:
                    reportingPeriod.emissions.scope3.scope3Categories.reduce(
                      (total, category) =>
                        // TODO: Question for Alex - do we also want to include the "16. Other" category in the calculcatedTotalEmissions for all scope 3 categories?
                        // Or should we keep it separate?
                        Number.isFinite(category.total)
                          ? category.total + total
                          : total,
                      0
                    ),
                }) ||
                undefined,
            },
            metadata: reportingPeriod.metadata[0],
          })),
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
          reportingPeriods: company.reportingPeriods.map((reportingPeriod) => ({
            ...reportingPeriod,
            emissions: {
              ...reportingPeriod.emissions,
              calculatedTotalEmissions:
                reportingPeriod.emissions?.scope1?.total +
                (reportingPeriod.emissions?.scope2?.calculatedTotalEmissions ||
                  0) +
                (reportingPeriod.emissions?.scope3?.calculatedTotalEmissions ||
                  0),
            },
          })),
        }))
    )
  } catch (error) {
    throw new GarboAPIError('Failed to load companies', {
      original: error,
      statusCode: 500,
    })
  }
})

router.get(
  '/:wikidataId',
  validateRequestParams(wikidataIdParamSchema),
  cache(),
  async (req: Request, res: Response) => {
    const { wikidataId } = req.params
    try {
      const company = await prisma.company.findFirst({
        where: { wikidataId },
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
                      scope3Categories: {
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

      res.json(
        [company]
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
                        reportingPeriod.emissions.scope2.mb ||
                        reportingPeriod.emissions.scope2.lb ||
                        reportingPeriod.emissions.scope2.unknown,
                    }) ||
                    undefined,
                  scope3:
                    (reportingPeriod.emissions?.scope3 && {
                      ...reportingPeriod.emissions.scope3,
                      calculatedTotalEmissions:
                        reportingPeriod.emissions.scope3.scope3Categories.reduce(
                          (total, category) =>
                            // TODO: Question for Alex - do we also want to include the "16. Other" category in the calculcatedTotalEmissions for all scope 3 categories?
                            // Or should we keep it separate?
                            Number.isFinite(category.total)
                              ? category.total + total
                              : total,
                          0
                        ),
                    }) ||
                    undefined,
                },
                metadata: reportingPeriod.metadata[0],
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
                emissions: {
                  ...reportingPeriod.emissions,
                  calculatedTotalEmissions:
                    reportingPeriod.emissions?.scope1?.total +
                    (reportingPeriod.emissions?.scope2
                      ?.calculatedTotalEmissions || 0) +
                    (reportingPeriod.emissions?.scope3
                      ?.calculatedTotalEmissions || 0),
                },
              })
            ),
          }))
          .at(0)
      )
    } catch (error) {
      throw new GarboAPIError('Failed to load company', {
        original: error,
        statusCode: 500,
      })
    }
  }
)

export default router
