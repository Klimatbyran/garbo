import express, { Request, Response } from 'express'
import { Prisma, PrismaClient } from '@prisma/client'
import { getGics } from '../lib/gics'
import bodyParser from 'body-parser'

const prisma = new PrismaClient()

const router = express.Router()

const metadata = {
  select: {
    comment: true,
    updatedAt: true,
    updater: {
      select: {
        name: true,
      },
    },
    verifier: {
      select: {
        name: true,
      },
    },
    sources: {
      select: {
        url: true,
        comment: true,
      },
    },
  },
}

const tCO2e = 'tCO2e'
const unit = tCO2e

const cache = () => {
  return (req: Request, res: Response, next: Function) => {
    res.set('Cache-Control', 'public, max-age=3000')
    next()
  }
}

router.get('/companies', cache(), async (req: Request, res: Response) => {
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
            economy: {
              select: {
                turnover: {
                  select: {
                    value: true,
                    currency: {
                      select: {
                        name: true,
                      },
                    },
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
                metadata,
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
    console.error('Failed to fetch company emission reports:', error)
    res.status(500).json({ error: 'Error fetching company emission reports' })
  }
})

const fakeAuth = (options?) => (req, res, next) => {
  req.user = {
    id: 2,
    name: 'Alexandra Palmqvist',
    email: 'alex@klimatkollen.se',
  }
  next()
}

router.post(
  '/companies/:wikidataId/:year/emissions',
  fakeAuth(),
  bodyParser.json(),
  async (req: Request, res: Response) => {
    console.log(req.body.scope1)

    const wikidataId = req.params.wikidataId
    const year = req.params.year
    const scope1 = parseFloat(req.body.scope1)
    const url = req.body.url

    const company = await prisma.company.findFirst({ where: { wikidataId } })
    const reportingPeriod = await prisma.reportingPeriod.findFirst({
      where: {
        companyId: wikidataId,
        // TODO: Handle date ranges (date within the same year)
        endDate: {
          gt: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        } as Prisma.DateTimeFilter,
      },
    })

    // TODO: create a reportingPeriod if it doesn't exist
    // await prisma.

    const metadata = {
      source: url,
      userId: req.user.id,
    }

    await prisma.emissions.upsert({
      where: {
        // TODO: crash when reportingPeriod is null
        id: reportingPeriod.emissionsId,
      },
      create: {
        // TODO: only update the included data
        scope1: {
          create: {
            total: scope1,
            unit: tCO2e,

            metadata: {
              create: {
                ...metadata,
              },
            },
          },
        },
      },
      update: {
        // TODO: only update the included data
        scope1: {
          update: {
            data: {
              total: scope1,
            },
          },
        },
      },
    })
  }
)

// router.get('/companies/:wikidataId', async (req: Request, res: Response) => {
//   try {
//     const reports = await opensearch.getLatestApprovedReportsForWikidataId(
//       req.params.wikidataId
//     )
//     if (reports) {
//       const company = reports.pop()
//       res.json(company)
//     } else {
//       res.status(404).send('Company emission reports not found')
//     }
//   } catch (error) {
//     console.error('Failed to fetch company emission reports:', error)
//     res.status(500).json({ error: 'Error fetching company emission reports' })
//   }
// })

export default router
