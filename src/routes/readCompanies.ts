import express, { Request, Response, NextFunction } from 'express'
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

function isNumber(n: unknown): n is number {
  return Number.isFinite(n)
}

import { DEVELOPMENT_ORIGINS, PRODUCTION_ORIGINS } from '../constants/api'

const origins = process.env.NODE_ENV === 'development' 
  ? DEVELOPMENT_ORIGINS 
  : PRODUCTION_ORIGINS

router.use(enableCors(origins))

// TODO: Find a way to re-use the same logic to process companies both for GET /companies and GET /companies/:wikidataId

/**
 * @swagger
 * /companies:
 *   get:
 *     summary: Get all companies
 *     description: Retrieve a list of all companies with their emissions, economic data, industry classification, goals, and initiatives
 *     tags: [Companies]
 *     responses:
 *       200:
 *         description: List of companies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 allOf:
 *                   - $ref: '#/components/schemas/Company'
 *                   - type: object
 *                     properties:
 *                       reportingPeriods:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             startDate:
 *                               type: string
 *                               format: date-time
 *                             endDate:
 *                               type: string
 *                               format: date-time
 *                             reportURL:
 *                               type: string
 *                             emissions:
 *                               $ref: '#/components/schemas/Emissions'
 *                             economy:
 *                               $ref: '#/components/schemas/Economy'
 *                             metadata:
 *                               $ref: '#/components/schemas/Metadata'
 *                       industry:
 *                         type: object
 *                         properties:
 *                           industryGics:
 *                             type: object
 *                             properties:
 *                               sectorCode:
 *                                 type: string
 *                               groupCode:
 *                                 type: string
 *                               industryCode:
 *                                 type: string
 *                               subIndustryCode:
 *                                 type: string
 *                               sv:
 *                                 type: object
 *                                 properties:
 *                                   sectorName:
 *                                     type: string
 *                                   groupName:
 *                                     type: string
 *                                   industryName:
 *                                     type: string
 *                                   subIndustryName:
 *                                     type: string
 *                                   subIndustryDescription:
 *                                     type: string
 *                               en:
 *                                 type: object
 *                                 properties:
 *                                   sectorName:
 *                                     type: string
 *                                   groupName:
 *                                     type: string
 *                                   industryName:
 *                                     type: string
 *                                   subIndustryName:
 *                                     type: string
 *                                   subIndustryDescription:
 *                                     type: string
 *                           metadata:
 *                             $ref: '#/components/schemas/Metadata'
 *                       goals:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/Goal'
 *                       initiatives:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/Initiative'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get(
  '/',
  cache(),
  async (req: Request, res: Response, next: NextFunction) => {
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
                        reportingPeriod.emissions.scope3.categories.reduce(
                          (total, category) =>
                            isNumber(category.total)
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
                    (reportingPeriod.emissions?.scope1?.total || 0) +
                    (reportingPeriod.emissions?.scope2
                      ?.calculatedTotalEmissions || 0) +
                    (reportingPeriod.emissions?.scope3
                      ?.calculatedTotalEmissions || 0),
                },
              })
            ),
          }))
      )
    } catch (error) {
      next(
        new GarboAPIError('Failed to load companies', {
          original: error,
          statusCode: 500,
        })
      )
    }
  }
)

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
 *               $ref: '#/components/schemas/Company'
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
router.get(
  '/:wikidataId',
  validateRequestParams(wikidataIdParamSchema),
  cache(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { wikidataId } = req.params
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
        return next(new GarboAPIError('Company not found', { statusCode: 404 }))
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
                        reportingPeriod.emissions.scope3.categories.reduce(
                          (total, category) =>
                            isNumber(category.total)
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
                    (reportingPeriod.emissions?.scope1?.total || 0) +
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
      next(
        new GarboAPIError('Failed to load company', {
          original: error,
          statusCode: 500,
        })
      )
    }
  }
)

// Error handler middleware
router.use(
  (err: GarboAPIError, req: Request, res: Response, next: NextFunction) => {
    res.status(err.statusCode || 500).json({
      error: err.message,
      details: err.original || null,
    })
  }
)

export default router
