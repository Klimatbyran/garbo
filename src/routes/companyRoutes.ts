import express, { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const router = express.Router()

const metadata = {
  select: {
    comment: true,
    updatedAt: true,
    user: {
      select: {
        email: true,
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

router.get('/companies', async (req: Request, res: Response) => {
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
            emissions: {
              select: {
                scope1: {
                  select: {
                    total: true,
                    unit: true,
                  },
                },
                scope2: {
                  select: {
                    lb: true,
                    mb: true,
                    unknown: true,
                    unit: true,
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
                    other: true,
                    unit: true,
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
        industryGics: true,
        goals: {
          select: {
            description: true,
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
    res.json(companies)
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
