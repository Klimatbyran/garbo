import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function emptyDB() {
  await prisma.$transaction([
    prisma.company.deleteMany(),
    prisma.metadata.deleteMany(),
  ])
}

async function migrateData() {
  const data = JSON.parse(
    fs.readFileSync('scripts/2025-01-08-prod-companies.json', {
      encoding: 'utf-8',
    })
  )

  const [garbo, alex] = await Promise.all([
    prisma.user.findFirstOrThrow({ where: { email: 'hej@klimatkollen.se' } }),
    prisma.user.findFirstOrThrow({ where: { email: 'alex@klimatkollen.se' } }),
  ])

  const userIds = {
    'Garbo (Klimatkollen)': garbo.id,
    'Alex (Klimatkollen)': alex.id,
  }

  const createMetadata = (metadata: any) => {
    if (!metadata) return undefined
    const { source, comment, user, verifiedBy, updatedAt } = metadata
    return {
      create: [
        {
          comment,
          source,
          userId: userIds[user.name],
          verifiedByUserId: verifiedBy ? userIds[verifiedBy.name] : null,
          updatedAt: new Date(updatedAt),
        },
      ],
    }
  }

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
          metadata: createMetadata(industry.metadata),
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
          metadata: createMetadata(period.metadata),
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
                    metadata: createMetadata(period.economy.turnover.metadata),
                  },
                }
              : undefined,
            employees: period.economy.employees
              ? {
                  create: {
                    ...period.economy.employees,
                    metadata: createMetadata(period.economy.employees.metadata),
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
                    metadata: createMetadata(period.emissions.scope1.metadata),
                  },
                }
              : undefined,
            scope2: period.emissions.scope2
              ? {
                  create: {
                    ...period.emissions.scope2,
                    calculatedTotalEmissions: undefined,
                    metadata: createMetadata(period.emissions.scope2.metadata),
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
                            metadata: createMetadata(
                              period.emissions.scope3.statedTotalEmissions
                                .metadata
                            ),
                          },
                        }
                      : undefined,
                    categories: {
                      create: period.emissions.scope3.categories.map(
                        (category) => ({
                          ...category,
                          metadata: createMetadata(category.metadata),
                        })
                      ),
                    },
                    metadata: createMetadata(period.emissions.scope3.metadata),
                  },
                }
              : undefined,
            biogenicEmissions: period.emissions.biogenicEmissions
              ? {
                  create: {
                    ...period.emissions.biogenicEmissions,
                    metadata: createMetadata(
                      period.emissions.biogenicEmissions.metadata
                    ),
                  },
                }
              : undefined,
            scope1And2: period.emissions.scope1And2
              ? {
                  create: {
                    ...period.emissions.scope1And2,
                    metadata: createMetadata(
                      period.emissions.scope1And2.metadata
                    ),
                  },
                }
              : undefined,
            statedTotalEmissions: period.emissions.statedTotalEmissions
              ? {
                  create: {
                    ...period.emissions.statedTotalEmissions,
                    metadata: createMetadata(
                      period.emissions.statedTotalEmissions.metadata
                    ),
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
          metadata: createMetadata(goal.metadata),
        },
      })
    }

    for (const initiative of initiatives) {
      await prisma.initiative.create({
        data: {
          ...initiative,
          companyId: createdCompany.wikidataId,
          metadata: createMetadata(initiative.metadata),
        },
      })
    }
  }
}

emptyDB()
  .then(migrateData)
  .then(() => {
    console.log('Successfully imported all companies!')
  })
  .catch((error) => console.error(error))
  .finally(async () => {
    await prisma.$disconnect()
  })
