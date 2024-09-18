import express, { NextFunction, Request, Response } from 'express'
import { Prisma, PrismaClient } from '@prisma/client'
import { getGics } from '../lib/gics'
import { z } from 'zod'
import { processRequest, validateRequest } from 'zod-express-middleware'
import type { Emissions, Scope1, Scope2 } from '../types/Company'
import { assert } from 'console'

const prisma = new PrismaClient()

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

const tCO2e = 'tCO2e'
const unit = tCO2e

interface Metadata {
  source: any
  userId: any
}

async function updateScope1(
  emissions: Emissions,
  scope1: Scope1,
  metadata: Metadata
) {
  return emissions.scope1Id
    ? await prisma.scope1.update({
        where: {
          id: emissions.scope1Id,
        },
        data: {
          ...scope1,
          metadata: {
            create: {
              ...metadata,
            },
          },
        },
        select: { id: true },
      })
    : await prisma.scope1.create({
        data: {
          ...scope1,
          unit: tCO2e,
          metadata: {
            create: {
              ...metadata,
            },
          },
        },
        select: { id: true },
      })
}

async function updateScope2(
  emissions: Emissions,
  scope2: Scope2,
  metadata: Metadata
) {
  return emissions.scope2Id
    ? await prisma.scope2.update({
        where: {
          id: emissions.scope2Id,
        },
        data: {
          ...scope2,
          metadata: {
            create: {
              ...metadata,
            },
          },
        },
        select: { id: true },
      })
    : await prisma.scope2.create({
        data: {
          ...scope2,
          unit: tCO2e,
          metadata: {
            create: {
              ...metadata,
            },
          },
        },
        select: { id: true },
      })
}

const cache = () => {
  return (req: Request, res: Response, next: NextFunction) => {
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

const fakeAuth =
  (options?) => (req: Request, res: Response, next: NextFunction) => {
    res.locals.user = {
      id: 2,
      name: 'Alexandra Palmqvist',
      email: 'alex@klimatkollen.se',
    }
    next()
  }

const createMetadata =
  () => async (req: Request, res: Response, next: NextFunction) => {
    // TODO: Find a better way to determine if changes by the current user should count as verified or not
    const verifiedByUserId = res.locals.user.id === 2 ? 2 : null
    const metadata = {
      source: req.body.url,
      userId: res.locals.user.id,
      verifiedByUserId,
    }
    res.locals.metadata = metadata
    next()
  }

const reportingPeriod =
  () => async (req: Request, res: Response, next: NextFunction) => {
    const { wikidataId, year } = req.params
    const { startDate, endDate, reportURL } = req.body

    const company = await prisma.company.findFirst({ where: { wikidataId } })
    if (!company) {
      return res.status(404).json({ error: 'Company not found' })
    }
    res.locals.company = company

    const endYear = parseInt(year.split('-').at(-1))
    if (endYear !== endDate.getFullYear()) {
      return res.status(400).json({
        error:
          'The URL param year must be the same year as the endDate (' +
          endYear +
          ') ',
      })
    }

    console.log(wikidataId, company.name)

    const metadata = res.locals.metadata

    assert(company.wikidataId === wikidataId, 'Company wikidataId mismatch')
    assert(startDate, 'startDate must be provided')
    assert(endDate, 'endDate must be provided')
    assert(
      startDate.getTime() < endDate.getTime(),
      'startDate must be earlier than endDate'
    )
    assert(
      startDate.getTime() < endDate.getTime(),
      'startDate must be earlier than endDate'
    )

    const reportingPeriod =
      (await prisma.reportingPeriod.findFirst({
        where: {
          companyId: wikidataId,
          // TODO: find the reporting period with the same endYear
          endDate: {},
        },
      })) ||
      console.log('creating company') ||
      (await prisma.reportingPeriod.create({
        data: {
          startDate,
          endDate,
          reportURL,
          company: {
            connect: {
              wikidataId,
            },
          },
          metadata: {
            create: metadata,
          },
        },
      }))
    res.locals.reportingPeriod = reportingPeriod

    next()
  }

const ensureEmissionsExists =
  () => async (req: Request, res: Response, next: NextFunction) => {
    const reportingPeriod = res.locals.reportingPeriod
    const emissionsId = res.locals.reportingPeriod.emissionsId

    const emissions = emissionsId
      ? await prisma.emissions.findFirst({
          where: { id: emissionsId },
          select: { id: true, scope1Id: true, scope2Id: true },
        })
      : await prisma.emissions.create({
          data: {
            reportingPeriods: {
              connect: {
                id: reportingPeriod.id,
              },
            },
          },
          select: { id: true, scope1Id: true, scope2Id: true },
        })

    res.locals.emissions = emissions

    next()
  }

router.use('/companies', fakeAuth())
router.use('/companies', express.json())

router.use(
  '/companies/:wikidataId',
  validateRequest({
    params: z.object({
      wikidataId: z.string().regex(/Q\d+/),
    }),
  })
)

// TODO: maybe begin transaction here, and cancel in the POST handler if there was no meaningful change
router.use('/companies/:wikidataId', createMetadata())

// TODO: Allow creating a company with more data included.
router.post(
  '/companies/:wikidataId',
  validateRequest({
    body: z.object({ name: z.string(), description: z.string().optional() }),
  }),
  async (req, res) => {
    const { name, description } = req.body
    const { wikidataId } = req.params

    try {
      await prisma.company.upsert({
        where: {
          wikidataId,
        },
        create: {
          name,
          description,
          wikidataId,
        },
        update: { name, description },
      })
    } catch (error) {
      console.error('Failed to create company', error)
      return res.status(500).json({ error: 'Failed to create company' })
    }

    res.status(200).send()
  }
)

router.use(
  '/companies/:wikidataId/:year',
  processRequest({
    params: z.object({
      year: z.string().regex(/\d{4}(?:-\d{4})?/),
    }),
    body: z
      .object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        reportURL: z.string().optional(),
      })
      .refine(
        ({ startDate, endDate }) => startDate.getTime() < endDate.getTime(),
        { message: 'startDate must be earlier than endDate' }
      ),
  }),
  reportingPeriod()
)

router.use('/companies/:wikidataId/:year/emissions', ensureEmissionsExists())

// POST/companies/Q12345/2022-2023/emissions
router.post(
  '/companies/:wikidataId/:year/emissions',
  validateRequest({
    body: z.object({
      scope1: z
        .object({
          total: z.number(),
        })
        .optional(),
      scope2: z
        .object({
          mb: z.number().optional(),
          lb: z.number().optional(),
          unknown: z.number().optional(),
        })
        .refine(
          ({ mb, lb, unknown }) =>
            mb !== undefined || lb !== undefined || unknown !== undefined,
          {
            message: 'One of the fields must be defined if scope2 is provided',
          }
        )
        .optional(),
      // statedTotalEmissions
      // biogenic
      // scope3 with all sub properties
    }),
  }),
  async (req, res) => {
    const { scope1, scope2 } = req.body
    const metadata = res.locals.metadata
    const emissions = res.locals.emissions

    try {
      scope1 && (await updateScope1(emissions, scope1, metadata))
      scope2 && (await updateScope2(emissions, scope2, metadata))
    } catch (error) {
      console.error('Failed to update emissions:', error)
      return res.status(500).json({ error: 'Failed to update emissions' })
    }

    res.status(200).send()
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
