import { PrismaClient, Metadata, Scope1, Scope2, Company } from '@prisma/client'

export const prisma = new PrismaClient()

const tCO2e = 'tCO2e'

// type X = Parameters<typeof prisma.scope1.update>[0]

// TODO: use actual types inferred from Parameters<typeof prisma.scope1.update>
export async function updateScope1(
  id: Scope1['id'],
  scope1: Scope1,
  metadata: Metadata
) {
  return id
    ? await prisma.scope1.update({
        where: {
          id,
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
        },
        select: { id: true },
      })
}

export async function updateScope2(
  id: Scope2['id'],
  scope2: Omit<Scope2, 'id'>,
  metadata: Omit<Metadata, 'id'>
) {
  return id
    ? await prisma.scope2.update({
        where: {
          id,
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
            create: {
              ...metadata,
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
}: {
  wikidataId: string
  name: string
  description?: string
}) {
  return prisma.company.upsert({
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
}

export async function ensureReportingPeriodExists(
  company: Company,
  metadata: Parameters<typeof prisma.metadata.create>[0]['data'],
  startDate: Date,
  endDate: Date
) {
  const existingReportingPeriod = await prisma.reportingPeriod.findFirst({
    where: {
      companyId: company.wikidataId,
      endDate,
    },
  })
  if (existingReportingPeriod) return existingReportingPeriod
  return await prisma.reportingPeriod.create({
    data: {
      startDate,
      endDate,
      company: {
        connect: {
          wikidataId: company.wikidataId,
        },
      },
      metadata: {
        connect: metadata,
      },
    },
  })
}
