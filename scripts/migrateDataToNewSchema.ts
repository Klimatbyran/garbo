import { PrismaClient } from '@prisma/client'
import { apiFetch } from '../src/lib/api'
import apiConfig from '../src/config/api'

import { readFileSync } from 'fs'

type Metadata = {
  comment: string
  source: string | null
  updatedAt: string
  user: { name: string }
  verifiedBy: { name: string | null }
}

type EmissionsScope = {
  total?: number
  unit: string
  metadata: Metadata
  lb?: number | null
  mb?: number | null
  unknown?: number | null
  calculatedTotalEmissions?: number
}

type Emissions = {
  scope1?: EmissionsScope
  scope2?: EmissionsScope
  scope3?: {
    statedTotalEmissions?: EmissionsScope
    categories?: {
      category: number
      total: number
      unit: string
      metadata: Metadata
    }[]
    metadata: Metadata
    calculatedTotalEmissions?: number
  }
  biogenicEmissions?: {
    total: number
    unit: string
    metadata: Metadata
  }
  scope1And2?: EmissionsScope
  statedTotalEmissions?: EmissionsScope
  calculatedTotalEmissions?: number
}

type Turnover = {
  value: number
  currency: string
  metadata: Metadata
}

type Employees = {
  value: number
  unit: string
  metadata: Metadata
}

type Economy = {
  turnover?: Turnover
  employees?: Employees
}

type ReportingPeriod = {
  startDate: string
  endDate: string
  reportURL?: string | null
  economy?: Economy | null
  emissions?: Emissions | null
  metadata: Metadata
}

type IndustryGics = {
  sectorCode: string
  groupCode: string
  industryCode: string
  subIndustryCode: string
}

type Industry = {
  industryGics: IndustryGics
  metadata: Metadata
}

type Goal = {
  id: number
  description: string
  year: string | null
  baseYear: string | null
  target: number | null
  metadata: Metadata
}

type Initiative = {
  id: number
  title: string
  description: string | null
  year: string | null
  scope: string | null
  metadata: Metadata
}

type Company = {
  wikidataId: string
  name: string
  description: string
  internalComment: string
  tags: string[]
  reportingPeriods: ReportingPeriod[]
  industry: Industry
  goals: Goal[]
  initiatives: Initiative[]
}

const prisma = new PrismaClient()

async function emptyDB() {
  await prisma.$transaction([
    prisma.company.deleteMany(),
    prisma.metadata.deleteMany(),
  ])
}

async function migrateData() {
  const data = JSON.parse(
    readFileSync('scripts/2025-01-08-prod-companies.json', 'utf-8')
  ) as Company[]

  const [garbo, alex] = await Promise.all([
    prisma.user.findFirstOrThrow({ where: { email: 'hej@klimatkollen.se' } }),
    prisma.user.findFirstOrThrow({ where: { email: 'alex@klimatkollen.se' } }),
  ])

  const userIds = {
    'Garbo (Klimatkollen)': garbo.id,
    'Alex (Klimatkollen)': alex.id,
  }

  const getMetadata = ({ source, comment }: any) => ({
    comment,
    source,
  })

  const getAuthHeaders = (user: keyof typeof apiConfig.authorizedUsers) => ({
    Authorization: `Bearer ${apiConfig.authorizedUsers[user]}`,
  })

  for (const company of data) {
    const { reportingPeriods, industry, goals, initiatives, ...companyData } =
      company

    await apiFetch(`/companies`, { body: companyData })

    const createdCompany = await prisma.company.create({
      data: { ...companyData },
    })

    if (industry) {
      const body = {
        industry: {
          gicsSubIndustryCode: industry.industryGics.subIndustryCode,
          companyWikidataId: createdCompany.wikidataId,
        },
        metadata: getMetadata(industry.metadata),
      }

      await apiFetch(`/companies/${createdCompany.wikidataId}/industry`, {
        body,
        headers: getAuthHeaders('garbo'),
      })
    }

    await apiFetch(
      `/companies/${createdCompany.wikidataId}/reporting-periods`,
      {
        body: {
          reportingPeriods: reportingPeriods.map((period) => ({
            startDate: period.startDate,
            endDate: period.endDate,
            reportURL: period.reportURL,
            emissions: period.emissions
              ? {
                  scope1: period.emissions.scope1
                    ? {
                        total: period.emissions.scope1.total,
                        unit: period.emissions.scope1.unit,
                        metadata: getMetadata(period.emissions.scope1.metadata),
                      }
                    : undefined,
                  scope2: period.emissions.scope2
                    ? {
                        mb: period.emissions.scope2.mb || undefined,
                        lb: period.emissions.scope2.lb || undefined,
                        unknown: period.emissions.scope2.unknown || undefined,
                        unit: period.emissions.scope2.unit,
                        metadata: getMetadata(period.emissions.scope2.metadata),
                      }
                    : undefined,
                  scope3: period.emissions.scope3
                    ? {
                        statedTotalEmissions: period.emissions.scope3
                          .statedTotalEmissions
                          ? {
                              total:
                                period.emissions.scope3.statedTotalEmissions
                                  .total,
                              unit: period.emissions.scope3.statedTotalEmissions
                                .unit,
                              metadata: getMetadata(
                                period.emissions.scope3.statedTotalEmissions
                                  .metadata
                              ),
                            }
                          : undefined,
                        categories: period.emissions.scope3.categories
                          ? period.emissions.scope3.categories.map(
                              (category) => ({
                                category: category.category,
                                total: category.total,
                                unit: category.unit,
                                metadata: getMetadata(category.metadata),
                              })
                            )
                          : [],
                        metadata: getMetadata(period.emissions.scope3.metadata),
                      }
                    : undefined,
                  biogenicEmissions: period.emissions.biogenicEmissions
                    ? {
                        total: period.emissions.biogenicEmissions.total,
                        unit: period.emissions.biogenicEmissions.unit,
                        metadata: getMetadata(
                          period.emissions.biogenicEmissions.metadata
                        ),
                      }
                    : undefined,
                  scope1And2: period.emissions.scope1And2
                    ? {
                        total: period.emissions.scope1And2.total,
                        unit: period.emissions.scope1And2.unit,
                        metadata: getMetadata(
                          period.emissions.scope1And2.metadata
                        ),
                      }
                    : undefined,
                  statedTotalEmissions: period.emissions.statedTotalEmissions
                    ? {
                        total: period.emissions.statedTotalEmissions.total,
                        unit: period.emissions.statedTotalEmissions.unit,
                        metadata: getMetadata(
                          period.emissions.statedTotalEmissions.metadata
                        ),
                      }
                    : undefined,
                }
              : undefined,

            economy: period.economy
              ? {
                  employees: period.economy.employees
                    ? {
                        ...period.economy.employees,
                        metadata: getMetadata(
                          period.economy.employees.metadata
                        ),
                      }
                    : undefined,
                  turnover: period.economy.turnover
                    ? {
                        ...period.economy.turnover,
                        metadata: getMetadata(period.economy.turnover.metadata),
                      }
                    : undefined,
                }
              : undefined,
            metadata: getMetadata(period.metadata),
          })),
        },
        headers: getAuthHeaders('alex'),
      }
    )

    if (goals?.length) {
      const body = {
        goals: goals.map((goal) => ({
          description: goal.description,
          year: goal.year,
          target: goal.target,
          baseYear: goal.baseYear,
        })),
      }

      await apiFetch(`/companies/${createdCompany.wikidataId}/goals`, {
        body,
        headers: getAuthHeaders('garbo'),
      })
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

emptyDB()
  .then(migrateData)
  .then(() => {
    console.log('Successfully imported all companies!')
  })
  .catch((error) => console.error(error))
  .finally(async () => {
    await prisma.$disconnect()
  })
