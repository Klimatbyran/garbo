import {
  Metadata,
  Scope1,
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
  Scope1And2,
} from '@prisma/client'
import { OptionalNullable } from './type-utils'
import {
  DefaultEconomyArgs,
  DefaultEmissions,
  economyArgs,
  emissionsArgs,
  reportingPeriodArgs,
} from '../routes/types'
import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()

const tCO2e = 'tCO2e'

export async function upsertScope1(
  emissions: DefaultEmissions,
  scope1: Omit<Scope1, 'id' | 'metadataId' | 'unit' | 'emissionsId'> | null,
  metadata: Metadata
) {
  const existingScope1Id = emissions.scope1?.id

  if (scope1 === null) {
    if (existingScope1Id) {
      await prisma.scope1.delete({
        where: { id: existingScope1Id },
      })
    }
    return null
  }

  return existingScope1Id
    ? prisma.scope1.update({
        where: { id: existingScope1Id },
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
  emissions: DefaultEmissions,
  scope2: {
    lb?: number | null
    mb?: number | null
    unknown?: number | null
  } | null,
  metadata: Metadata
) {
  const existingScope2Id = emissions.scope2?.id

  if (scope2 === null) {
    if (existingScope2Id) {
      await prisma.scope2.delete({
        where: { id: existingScope2Id },
      })
    }
    return null
  }

  return existingScope2Id
    ? prisma.scope2.update({
        where: { id: existingScope2Id },
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

export async function upsertScope1And2(
  emissions: DefaultEmissions,
  scope1And2: Omit<
    Scope1And2,
    'id' | 'metadataId' | 'unit' | 'emissionsId'
  > | null,
  metadata: Metadata
) {
  const existingScope1And2Id = emissions.scope1And2?.id

  if (scope1And2 === null) {
    if (existingScope1And2Id) {
      await prisma.scope1And2.delete({
        where: { id: existingScope1And2Id },
      })
    }
    return null
  }

  return existingScope1And2Id
    ? prisma.scope1And2.update({
        where: { id: existingScope1And2Id },
        data: {
          ...scope1And2,
          metadata: {
            connect: {
              id: metadata.id,
            },
          },
        },
        select: { id: true },
      })
    : prisma.scope1And2.create({
        data: {
          ...scope1And2,
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
  emissions: DefaultEmissions,
  scope3: {
    categories?: { category: number; total: number | null }[]
    statedTotalEmissions?: OptionalNullable<
      Omit<StatedTotalEmissions, 'id' | 'metadataId' | 'unit' | 'scope3Id'>
    > | null
  },
  metadata: Metadata
) {
  const existingScope3Id = emissions.scope3?.id

  const updatedScope3 = await prisma.scope3.upsert({
    where: { id: existingScope3Id ?? 0 },
    update: {},
    create: {
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
      statedTotalEmissions: { select: { id: true } },
      categories: {
        select: {
          id: true,
          category: true,
        },
      },
    },
  })

  await prisma.scope3Category.deleteMany({
    where: {
      scope3Id: updatedScope3.id,
      category: {
        in: (scope3.categories ?? [])
          .filter((c) => c.total === null)
          .map((c) => c.category),
      },
    },
  })

  // Upsert only the scope 3 categories from the request body
  await Promise.all(
    (scope3.categories ?? []).map((scope3Category) => {
      const matching = updatedScope3.categories.find(
        ({ category }) => scope3Category.category === category
      )

      if (scope3Category.total === null) {
        return null
      }

      return prisma.scope3Category.upsert({
        where: {
          id: matching?.id ?? 0,
        },
        update: {
          ...scope3Category,
          metadata: {
            connect: {
              id: metadata.id,
            },
          },
        },
        create: {
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
    })
  )

  if (scope3.statedTotalEmissions !== undefined) {
    await upsertStatedTotalEmissions(
      emissions,
      scope3.statedTotalEmissions,
      metadata,
      updatedScope3
    )
  }
}

export async function upsertBiogenic(
  emissions: DefaultEmissions,
  biogenic: OptionalNullable<
    Omit<BiogenicEmissions, 'id' | 'metadataId' | 'unit' | 'emissionsId'>
  > | null,
  metadata: Metadata
) {
  const existingBiogenicEmissionsId = emissions.biogenicEmissions?.id

  if (biogenic === null) {
    if (existingBiogenicEmissionsId) {
      await prisma.biogenicEmissions.delete({
        where: { id: existingBiogenicEmissionsId },
      })
    }
    return null
  }

  return existingBiogenicEmissionsId
    ? prisma.biogenicEmissions.update({
        where: {
          id: existingBiogenicEmissionsId,
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
  emissions: DefaultEmissions,
  statedTotalEmissions: OptionalNullable<
    Omit<
      StatedTotalEmissions,
      'id' | 'metadataId' | 'unit' | 'scope3Id' | 'emissionsId'
    >
  > | null,
  metadata: Metadata,
  scope3?: Scope3 & { statedTotalEmissions: { id: number } | null }
) {
  const statedTotalEmissionsId = scope3
    ? scope3.statedTotalEmissionsId || scope3?.statedTotalEmissions?.id
    : emissions.statedTotalEmissions?.id

  if (statedTotalEmissions === null) {
    if (statedTotalEmissionsId) {
      await prisma.statedTotalEmissions.delete({
        where: {
          id: statedTotalEmissionsId,
        },
      })
    }
    return null
  }

  return prisma.statedTotalEmissions.upsert({
    where: { id: statedTotalEmissionsId ?? 0 },
    create: {
      ...statedTotalEmissions,
      unit: tCO2e,
      emissions: scope3
        ? undefined
        : {
            connect: { id: emissions.id },
          },
      scope3: scope3
        ? {
            connect: { id: scope3.id },
          }
        : undefined,
      metadata: {
        connect: { id: metadata.id },
      },
    },
    update: {
      ...statedTotalEmissions,
      metadata: {
        connect: { id: metadata.id },
      },
    },
    select: { id: true },
  })
}

export async function upsertCompany({
  wikidataId,
  ...data
}: {
  wikidataId: string
  name: string
  description?: string
  url?: string
  internalComment?: string
  tags?: string[]
}) {
  return prisma.company.upsert({
    where: {
      wikidataId,
    },
    create: {
      ...data,
      wikidataId,
    },
    // TODO: Should we allow updating the wikidataId?
    // Probably yes from a business perspective, but that also means we need to update all related records too.
    // Updating the primary key can be tricky, especially with backups using the old primary key no longer being compatible.
    // This might be a reason why we shouldn't use wikidataId as our primary key in the DB.
    // However, no matter what, we could still use wikidataId in the API and in the URL structure.
    update: { ...data },
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

export async function deleteGoal(id: Goal['id']) {
  return prisma.goal.delete({ where: { id } })
}

export async function createInitiatives(
  wikidataId: Company['wikidataId'],
  initiatives: OptionalNullable<
    Omit<Initiative, 'metadataId' | 'companyId' | 'id'>
  >[],
  metadata: Metadata
) {
  return prisma.$transaction(
    initiatives.map((initiative) =>
      prisma.initiative.create({
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

export async function updateInitiative(
  id: Initiative['id'],
  initiative: OptionalNullable<
    Omit<Initiative, 'metadataId' | 'companyId' | 'id'>
  >,
  metadata: Metadata
) {
  return prisma.initiative.update({
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
}

export async function deleteInitiative(id: Initiative['id']) {
  return prisma.initiative.delete({ where: { id } })
}

export async function upsertTurnover(
  economy: Economy,
  turnover: OptionalNullable<
    Omit<Turnover, 'id' | 'metadataId' | 'unit' | 'economyId'>
  > | null,
  metadata: Metadata
) {
  if (turnover === null) {
    if (economy.turnoverId) {
      await prisma.turnover.delete({
        where: { id: economy.turnoverId },
      })
    }
    return null
  }

  return prisma.turnover.upsert({
    where: { id: economy.turnoverId ?? 0 },
    create: {
      ...turnover,
      metadata: {
        connect: { id: metadata.id },
      },
      economy: {
        connect: { id: economy.id },
      },
    },
    update: {
      ...turnover,
      metadata: {
        connect: { id: metadata.id },
      },
    },
    select: { id: true },
  })
}

export async function upsertEmployees(
  economy: DefaultEconomyArgs,
  employees: OptionalNullable<
    Omit<Employees, 'id' | 'metadataId' | 'economyId'>
  > | null,
  metadata: Metadata
) {
  const existingEmployeesId = economy.employees?.id

  if (employees === null) {
    if (existingEmployeesId) {
      await prisma.employees.delete({
        where: { id: existingEmployeesId },
      })
    }
    return null
  }

  return prisma.employees.upsert({
    where: { id: existingEmployeesId ?? 0 },
    create: {
      ...employees,
      metadata: {
        connect: { id: metadata.id },
      },
      economy: {
        connect: { id: economy.id },
      },
    },
    update: {
      ...employees,
      metadata: {
        connect: { id: metadata.id },
      },
    },
    select: { id: true },
  })
}

export async function createIndustry(
  wikidataId: Company['wikidataId'],
  industry: { subIndustryCode: string },
  metadata: Metadata
) {
  return prisma.industry.create({
    data: {
      company: {
        connect: { wikidataId },
      },
      industryGics: {
        connect: {
          subIndustryCode: industry.subIndustryCode,
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

export async function updateIndustry(
  wikidataId: Company['wikidataId'],
  industry: { subIndustryCode: string },
  metadata: Metadata
) {
  return prisma.industry.update({
    where: { companyWikidataId: wikidataId },
    data: {
      industryGics: {
        connect: {
          subIndustryCode: industry.subIndustryCode,
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

export async function upsertReportingPeriod(
  company: Company,
  metadata: Parameters<typeof prisma.metadata.create>[0]['data'],
  {
    startDate,
    endDate,
    reportURL,
    year,
  }: { startDate: Date; endDate: Date; reportURL?: string; year: string }
) {
  return prisma.reportingPeriod.upsert({
    where: {
      id: 329329, // MAJOR REMINDER TO FIX
      companyId: company.wikidataId,
      year,
      // NOTE: Maybe only check it's the same year of the endDate, instead of requiring the exact date to be provided in the request body.
      // We might want to allow just sending a GET request to for example /2023/emissions.
    },
    update: {},
    create: {
      startDate,
      endDate,
      reportURL,
      year,
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
    ...reportingPeriodArgs,
  })
}

export async function updateReportingPeriodReportURL(
  company: Company,
  year: string,
  reportURL: string
) {
  const reportingPeriod = await prisma.reportingPeriod.findFirst({
    where: {
      companyId: company.wikidataId,
      year,
    },
  })

  if (!reportingPeriod) {
    return false
  }

  return prisma.reportingPeriod.update({
    where: {
      id: reportingPeriod.id,
    },
    data: {
      reportURL,
    },
  })
}

export async function upsertEmissions({
  emissionsId,
  year,
  companyId,
}: {
  emissionsId: number
  year: string
  companyId: string
}) {
  return prisma.emissions.upsert({
    where: { id: emissionsId },
    update: {},
    create: {
      reportingPeriod: {
        connect: {
          id: 1234,
          // reportingPeriodId: {
          //   year,
          //   companyId,
          // },
        },
      },
    },
    ...emissionsArgs,
  })
}

export async function upsertEconomy({
  economyId,
  reportingPeriodId,
}: {
  economyId: number
  reportingPeriodId: number
}) {
  return prisma.economy.upsert({
    where: { id: economyId },
    update: {},
    create: {
      reportingPeriod: {
        connect: {
          id: reportingPeriodId,
        },
      },
    },
    ...economyArgs,
  })
}
