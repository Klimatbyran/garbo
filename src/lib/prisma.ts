import {
  PrismaClient,
  Metadata,
  Scope1,
  Scope2,
  Company,
  Emissions,
  BiogenicEmissions,
  StatedTotalEmissions,
  Scope3,
  Economy,
  Employees,
  Turnover,
  Goal,
  Initiative,
  Industry,
} from '@prisma/client'
import { OptionalNullable } from './type-utils'

export const prisma = new PrismaClient()

const tCO2e = 'tCO2e'

export async function upsertScope1(
  emissions: Emissions,
  scope1: OptionalNullable<Omit<Scope1, 'id' | 'metadataId' | 'unit'>>,
  metadata: Metadata
) {
  return emissions.scope1Id
    ? prisma.scope1.update({
        where: { id: emissions.scope1Id },
        data: {
          ...scope1,
          metadata: {
            connect: {
              id: metadata.id,
            },
          },
        },
        select: { id: true },
      })
    : prisma.scope1.create({
        data: {
          ...scope1,
          unit: tCO2e,
          metadata: {
            connect: {
              id: metadata.id,
            },
          },
          emissions: {
            connect: {
              id: emissions.id,
            },
          },
        },
        select: { id: true },
      })
}

export async function upsertScope2(
  emissions: Emissions,
  scope2: OptionalNullable<Omit<Scope2, 'id' | 'metadataId' | 'unit'>>,
  metadata: Metadata
) {
  return emissions.scope2Id
    ? prisma.scope2.update({
        where: { id: emissions.scope2Id },
        data: {
          ...scope2,
          metadata: {
            connect: {
              id: metadata.id,
            },
          },
        },
        select: { id: true },
      })
    : prisma.scope2.create({
        data: {
          ...scope2,
          unit: tCO2e,
          metadata: {
            connect: {
              id: metadata.id,
            },
          },
          emissions: {
            connect: {
              id: emissions.id,
            },
          },
        },
        select: { id: true },
      })
}

export async function upsertScope3(
  emissions: Emissions,
  scope3: {
    scope3Categories?: { category: number; total: number }[]
    statedTotalEmissions?: OptionalNullable<
      Omit<StatedTotalEmissions, 'id' | 'metadataId' | 'unit' | 'scope3Id'>
    >
  },
  metadata: Metadata
) {
  const updatedScope3 = emissions.scope3Id
    ? await prisma.scope3.findFirst({
        where: { id: emissions.scope3Id },
        include: { scope3Categories: { select: { id: true, category: true } } },
      })
    : await prisma.scope3.create({
        data: {
          metadata: {
            connect: {
              id: metadata.id,
            },
          },
          emissions: {
            connect: {
              id: emissions.id,
            },
          },
        },
        include: {
          scope3Categories: {
            select: {
              id: true,
              category: true,
            },
          },
        },
      })

  // Update existing scope 3 categories and create new ones
  await Promise.all(
    scope3.scope3Categories.map((scope3Category) =>
      updatedScope3.scope3Categories.find(
        ({ category }) => scope3Category.category === category
      )
        ? prisma.scope3Category.update({
            where: {
              id: updatedScope3.id,
            },
            data: {
              ...scope3Category,
              metadata: {
                connect: {
                  id: metadata.id,
                },
              },
            },
            select: { id: true },
          })
        : prisma.scope3Category.create({
            data: {
              ...scope3Category,
              unit: tCO2e,
              scope3: {
                connect: {
                  id: updatedScope3.id,
                },
              },
              metadata: {
                connect: {
                  id: metadata.id,
                },
              },
            },
            select: { id: true },
          })
    )
  )

  if (scope3.statedTotalEmissions) {
    const statedTotalEmissions = await upsertStatedTotalEmissions(
      emissions,
      scope3.statedTotalEmissions,
      metadata,
      updatedScope3
    )

    await prisma.scope3.update({
      where: { id: updatedScope3.id },
      data: {
        statedTotalEmissions: {
          connect: {
            id: statedTotalEmissions.id,
          },
        },
      },
      select: { id: true },
    })
  }
}

export async function upsertBiogenic(
  emissions: Emissions,
  biogenic: OptionalNullable<
    Omit<BiogenicEmissions, 'id' | 'metadataId' | 'unit'>
  >,
  metadata: Metadata
) {
  return emissions.biogenicEmissionsId
    ? prisma.biogenicEmissions.update({
        where: {
          id: emissions.biogenicEmissionsId,
        },
        data: {
          ...biogenic,
          metadata: {
            connect: {
              id: metadata.id,
            },
          },
        },
        select: { id: true },
      })
    : prisma.biogenicEmissions.create({
        data: {
          ...biogenic,
          unit: tCO2e,
          metadata: {
            connect: {
              id: metadata.id,
            },
          },
          emissions: {
            connect: {
              id: emissions.id,
            },
          },
        },
        select: { id: true },
      })
}

export async function upsertStatedTotalEmissions(
  emissions: Emissions,
  statedTotalEmissions: OptionalNullable<
    Omit<StatedTotalEmissions, 'id' | 'metadataId' | 'unit' | 'scope3Id'>
  >,
  metadata: Metadata,
  scope3?: Scope3
) {
  const statedTotalEmissionsId = scope3
    ? scope3.statedTotalEmissionsId
    : emissions.statedTotalEmissionsId

  return statedTotalEmissionsId
    ? prisma.statedTotalEmissions.update({
        where: { id: statedTotalEmissionsId },
        data: {
          ...statedTotalEmissions,
          metadata: {
            connect: {
              id: metadata.id,
            },
          },
        },
        select: { id: true },
      })
    : prisma.statedTotalEmissions.create({
        data: {
          ...statedTotalEmissions,
          unit: tCO2e,
          emissions: scope3
            ? undefined
            : {
                connect: {
                  id: emissions.id,
                },
              },
          scope3: scope3
            ? {
                connect: {
                  id: scope3.id,
                },
              }
            : undefined,
          metadata: {
            connect: {
              id: metadata.id,
            },
          },
        },
        select: { id: true },
      })
}

export async function upsertCompany({
  wikidataId,
  name,
  description,
  url,
  internalComment,
}: {
  wikidataId: string
  name: string
  description?: string
  url?: string
  internalComment?: string
}) {
  return prisma.company.upsert({
    where: {
      wikidataId,
    },
    create: {
      name,
      description,
      wikidataId,
      url,
      internalComment,
    },
    // TODO: Should we allow updating the wikidataId?
    // Probably yes from a business perspective, but that also means we need to update all related records too.
    // Updating the primary key can be tricky, especially with backups using the old primary key no longer being compatible.
    // This might be a reason why we shouldn't use wikidataId as our primary key in the DB.
    // However, no matter what, we could still use wikidataId in the API and in the URL structure.
    update: { name, description, url, internalComment },
  })
}

export async function createGoals(
  wikidataId: Company['wikidataId'],
  goals: OptionalNullable<
    Omit<Goal, 'metadataId' | 'reportingPeriodId' | 'companyId' | 'id'>
  >[],
  metadata: Metadata
) {
  return prisma.$transaction(
    goals.map((goal) =>
      prisma.goal.create({
        data: {
          ...goal,
          description: goal.description,
          company: {
            connect: {
              wikidataId,
            },
          },
          metadata: {
            connect: {
              id: metadata.id,
            },
          },
        },
        select: { id: true },
      })
    )
  )
}

export async function updateGoal(
  id: Goal['id'],
  goal: OptionalNullable<
    Omit<Goal, 'metadataId' | 'reportingPeriodId' | 'companyId' | 'id'>
  >,
  metadata: Metadata
) {
  return prisma.goal.update({
    where: { id },
    data: {
      ...goal,
      metadata: {
        connect: {
          id: metadata.id,
        },
      },
    },
    select: { id: true },
  })
}

export async function upsertInitiatives(
  wikidataId: Company['wikidataId'],
  initiatives: OptionalNullable<
    Omit<Initiative, 'metadataId' | 'reportingPeriodId' | 'companyId'>
  >[],
  metadata: Metadata
) {
  return prisma.$transaction(
    initiatives.map(({ id, ...initiative }) =>
      id
        ? prisma.initiative.update({
            where: { id },
            data: {
              ...initiative,
              metadata: {
                connect: {
                  id: metadata.id,
                },
              },
            },
            select: { id: true },
          })
        : prisma.initiative.create({
            data: {
              ...initiative,
              title: initiative.title,
              company: {
                connect: {
                  wikidataId,
                },
              },
              metadata: {
                connect: {
                  id: metadata.id,
                },
              },
            },
            select: { id: true },
          })
    )
  )
}

export async function upsertTurnover(
  economy: Economy,
  turnover: OptionalNullable<Omit<Turnover, 'id' | 'metadataId' | 'unit'>>,
  metadata: Metadata
) {
  return economy.turnoverId
    ? prisma.turnover.update({
        where: {
          id: economy.turnoverId,
        },
        data: {
          ...turnover,
          metadata: {
            connect: {
              id: metadata.id,
            },
          },
        },
        select: { id: true },
      })
    : prisma.turnover.create({
        data: {
          ...turnover,
          metadata: {
            connect: {
              id: metadata.id,
            },
          },
          economy: {
            connect: {
              id: economy.id,
            },
          },
        },
        select: { id: true },
      })
}

export async function upsertEmployees(
  economy: Economy,
  employees: OptionalNullable<Omit<Employees, 'id' | 'metadataId'>>,
  metadata: Metadata
) {
  return economy.employeesId
    ? prisma.employees.update({
        where: {
          id: economy.employeesId,
        },
        data: {
          ...employees,
          metadata: {
            connect: {
              id: metadata.id,
            },
          },
        },
        select: { id: true },
      })
    : prisma.employees.create({
        data: {
          ...employees,
          metadata: {
            connect: {
              id: metadata.id,
            },
          },
          economy: {
            connect: {
              id: economy.id,
            },
          },
        },
        select: { id: true },
      })
}

export async function upsertIndustry(
  wikidataId: Company['wikidataId'],
  {
    id,
    ...industry
  }: OptionalNullable<Omit<Industry, 'id' | 'metadataId'>> & { id?: number },
  metadata: Metadata
) {
  return id
    ? prisma.industry.update({
        where: { id },
        data: {
          industryGics: {
            connect: {
              subIndustryCode: industry.gicsSubIndustryCode,
            },
          },
          metadata: {
            connect: {
              id: metadata.id,
            },
          },
        },
        select: { id: true },
      })
    : prisma.industry.create({
        data: {
          company: {
            connect: { wikidataId },
          },
          industryGics: {
            connect: {
              subIndustryCode: industry.gicsSubIndustryCode,
            },
          },
          metadata: {
            connect: {
              id: metadata.id,
            },
          },
        },
        select: { id: true },
      })
}

export async function ensureReportingPeriodExists(
  company: Company,
  metadata: Parameters<typeof prisma.metadata.create>[0]['data'],
  {
    startDate,
    endDate,
    reportURL,
  }: { startDate: Date; endDate: Date; reportURL?: string }
) {
  const existingReportingPeriod = await prisma.reportingPeriod.findFirst({
    where: {
      companyId: company.wikidataId,
      // NOTE: Maybe only check it's the same year of the endDate, instead of requiring the exact date to be provided in the request body.
      // We might want to allow just sending a GET request to for example /2023/emissions.
      endDate,
    },
  })
  if (existingReportingPeriod) return existingReportingPeriod
  return await prisma.reportingPeriod.create({
    data: {
      startDate,
      endDate,
      reportURL,
      company: {
        connect: {
          wikidataId: company.wikidataId,
        },
      },
      metadata: {
        connect: {
          id: metadata.id,
        },
      },
    },
  })
}
