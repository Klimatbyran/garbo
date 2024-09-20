import {
  PrismaClient,
  Metadata,
  Scope1,
  Scope2,
  Company,
  Emissions,
} from '@prisma/client'
import { OptionalNullable } from './type-utils'

export const prisma = new PrismaClient()

const tCO2e = 'tCO2e'

export async function updateScope1(
  emissions: Emissions,
  scope1: OptionalNullable<Omit<Scope1, 'id' | 'metadataId' | 'unit'>>,
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
            connect: {
              id: metadata.id,
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

export async function updateScope2(
  emissions: Emissions,
  scope2: OptionalNullable<Omit<Scope2, 'id' | 'metadataId' | 'unit'>>,
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
            connect: {
              id: metadata.id,
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
