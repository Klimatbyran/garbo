import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function migrateData() {
  const data = JSON.parse(
    fs.readFileSync('scripts/2025-01-08-prod-companies.json', {
      encoding: 'utf-8',
    })
  )

  const userIds = {
    'Garbo (Klimatkollen)': 1,
    'Alex (Klimatkollen)': 2,
  }

  const getMetadata = ({
    source,
    comment,
    user,
    verifiedBy,
    updatedAt,
  }: any) => ({
    comment,
    source,
    userId: userIds[user.name],
    verifiedByUserId: verifiedBy ? userIds[verifiedBy.name] : null,
    updatedAt: new Date(updatedAt),
  })

  for (const company of data) {
    const { reportingPeriods, industry, goals, initiatives, ...companyData } =
      company

    const createdCompany = await prisma.company.create({
      data: { ...companyData },
    })

    if (industry) {
      await prisma.industry.create({
        data: {
          gicsSubIndustryCode: industry.industryGics.subIndustryCode,
          companyWikidataId: createdCompany.wikidataId,
          metadata: { create: [getMetadata(industry.metadata)] },
        },
      })
    }

    for (const period of reportingPeriods) {
      const createdPeriod = await prisma.reportingPeriod.create({
        data: {
          startDate: new Date(period.startDate),
          endDate: new Date(period.endDate),
          year: period.endDate.slice(0, 4),
          companyId: createdCompany.wikidataId,
          reportURL: period.reportURL,
        },
      })

      if (period.economy) {
        await prisma.economy.create({
          data: {
            reportingPeriodId: createdPeriod.id,
            turnover: period.economy.turnover
              ? {
                  create: {
                    ...period.economy.turnover,
                    metadata: {
                      create: [getMetadata(period.economy.turnover.metadata)],
                    },
                  },
                }
              : undefined,
            employees: period.economy.employees
              ? {
                  create: {
                    ...period.economy.employees,
                    metadata: {
                      create: [getMetadata(period.economy.employees.metadata)],
                    },
                  },
                }
              : undefined,
          },
        })
      }

      if (period.emissions) {
        await prisma.emissions.create({
          data: {
            reportingPeriodId: createdPeriod.id,
            scope1: period.emissions.scope1
              ? {
                  create: {
                    ...period.emissions.scope1,
                    metadata: {
                      create: [getMetadata(period.emissions.scope1.metadata)],
                    },
                  },
                }
              : undefined,
            scope2: period.emissions.scope2
              ? {
                  create: {
                    ...period.emissions.scope2,
                    calculatedTotalEmissions: undefined,
                    metadata: {
                      create: [getMetadata(period.emissions.scope2.metadata)],
                    },
                  },
                }
              : undefined,
            scope3: period.emissions.scope3
              ? {
                  create: {
                    statedTotalEmissions: period.emissions.scope3
                      .statedTotalEmissions
                      ? {
                          create: {
                            ...period.emissions.scope3.statedTotalEmissions,
                            metadata: {
                              create: [
                                getMetadata(
                                  period.emissions.scope3.statedTotalEmissions
                                    .metadata
                                ),
                              ],
                            },
                          },
                        }
                      : undefined,
                    categories: {
                      create: period.emissions.scope3.categories.map(
                        (category) => ({
                          ...category,
                          metadata: {
                            create: [getMetadata(category.metadata)],
                          },
                        })
                      ),
                    },
                    metadata: {
                      create: [getMetadata(period.emissions.scope3.metadata)],
                    },
                  },
                }
              : undefined,
            biogenicEmissions: period.emissions.biogenicEmissions
              ? {
                  create: {
                    ...period.emissions.biogenicEmissions,
                    metadata: {
                      create: [
                        getMetadata(
                          period.emissions.biogenicEmissions.metadata
                        ),
                      ],
                    },
                  },
                }
              : undefined,
            scope1And2: period.emissions.scope1And2
              ? {
                  create: {
                    ...period.emissions.scope1And2,
                    metadata: {
                      create: [
                        getMetadata(period.emissions.scope1And2.metadata),
                      ],
                    },
                  },
                }
              : undefined,
            statedTotalEmissions: period.emissions.statedTotalEmissions
              ? {
                  create: {
                    ...period.emissions.statedTotalEmissions,
                    metadata: {
                      create: [
                        getMetadata(
                          period.emissions.statedTotalEmissions.metadata
                        ),
                      ],
                    },
                  },
                }
              : undefined,
          },
        })
      }
    }

    for (const goal of goals) {
      await prisma.goal.create({
        data: {
          ...goal,
          companyId: createdCompany.wikidataId,
          metadata: { create: [getMetadata(goal.metadata)] },
        },
      })
    }

    for (const initiative of initiatives) {
      await prisma.initiative.create({
        data: {
          ...initiative,
          companyId: createdCompany.wikidataId,
          metadata: { create: [getMetadata(initiative.metadata)] },
        },
      })
    }
  }
}

migrateData()
  .catch((error) => console.error(error))
  .finally(async () => {
    await prisma.$disconnect()
  })
