import express, { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { getGics } from '../lib/gics'

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
    source: {
      select: {
        url: true,
        comment: true,
      },
    },
  },
}

const unit = {
  select: {
    name: true,
  },
}

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
                turnover: true,
                employees: true,
                currency: {
                  select: {
                    name: true,
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
                    unit,
                    metadata,
                  },
                },
                scope2: {
                  select: {
                    lb: true,
                    mb: true,
                    unknown: true,
                    unit,
                    metadata,
                  },
                },
                scope3: {
                  select: {
                    c1_purchasedGoods: true,
                    c2_capitalGoods: true,
                    c3_fuelAndEnergyRelatedActivities: true,
                    c4_upstreamTransportationAndDistribution: true,
                    c5_wasteGeneratedInOperations: true,
                    c6_businessTravel: true,
                    c7_employeeCommuting: true,
                    c8_upstreamLeasedAssets: true,
                    c9_downstreamTransportationAndDistribution: true,
                    c10_processingOfSoldProducts: true,
                    c11_useOfSoldProducts: true,
                    c12_endOfLifeTreatmentOfSoldProducts: true,
                    c13_downstreamLeasedAssets: true,
                    c14_franchises: true,
                    c15_investments: true,
                    statedTotalEmissions: {
                      select: {
                        total: true,
                        unit,
                        metadata,
                      },
                    },
                    other: true,
                    unit,
                    metadata,
                  },
                },
                biogenicEmissions: {
                  select: {
                    total: true,
                    unit,
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
                  calculatedTotalEmissions: Object.entries(
                    reportingPeriod.emissions.scope3
                  )
                    .filter(([key, value]) =>
                      [
                        'c1_purchasedGoods',
                        'c2_capitalGoods',
                        'c3_fuelAndEnergyRelatedActivities',
                        'c4_upstreamTransportationAndDistribution',
                        'c5_wasteGeneratedInOperations',
                        'c6_businessTravel',
                        'c7_employeeCommuting',
                        'c8_upstreamLeasedAssets',
                        'c9_downstreamTransportationAndDistribution',
                        'c10_processingOfSoldProducts',
                        'c11_useOfSoldProducts',
                        'c12_endOfLifeTreatmentOfSoldProducts',
                        'c13_downstreamLeasedAssets',
                        'c14_franchises',
                        'c15_investments',
                        'other',
                      ].includes(key)
                    )
                    .map(([key, value]) => parseFloat(value?.toString()) || 0)
                    .reduce((total, value) => value + total, 0),
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
