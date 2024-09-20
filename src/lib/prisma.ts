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
} from '@prisma/client'
import { OptionalNullable } from './type-utils'

export const prisma = new PrismaClient()

const tCO2e = 'tCO2e'

export async function upsertScope1(
  emissions: Emissions,
  scope1: OptionalNullable<Omit<Scope1, 'id' | 'metadataId' | 'unit'>>,
  metadata: Metadata
) {
  return prisma.scope1.upsert({
    where: {
      id: emissions.scope1Id,
    },
    update: {
      ...scope1,
      metadata: {
        connect: {
          id: metadata.id,
        },
      },
    },
    create: {
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
  return prisma.scope2.upsert({
    where: {
      id: emissions.scope2Id,
    },
    update: {
      ...scope2,
      metadata: {
        connect: {
          id: metadata.id,
        },
      },
    },
    create: {
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

export async function upsertBiogenic(
  emissions: Emissions,
  biogenic: OptionalNullable<
    Omit<BiogenicEmissions, 'id' | 'metadataId' | 'unit'>
  >,
  metadata: Metadata
) {
  return prisma.biogenicEmissions.upsert({
    where: {
      id: emissions.biogenicEmissionsId,
    },
    update: {
      ...biogenic,
      metadata: {
        connect: {
          id: metadata.id,
        },
      },
    },
    create: {
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

  return prisma.statedTotalEmissions.upsert({
    where: {
      id: statedTotalEmissionsId,
    },
    update: {
      ...statedTotalEmissions,
      metadata: {
        connect: {
          id: metadata.id,
        },
      },
    },
    create: {
      ...statedTotalEmissions,
      unit: tCO2e,
      metadata: {
        connect: {
          id: metadata.id,
        },
      },
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
