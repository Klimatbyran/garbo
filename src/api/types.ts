import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { goalSchema } from './schemas'

export const emissionsArgs = {
  include: {
    scope1: { select: { id: true } },
    scope2: { select: { id: true } },
    scope3: { select: { id: true } },
    biogenicEmissions: { select: { id: true } },
    scope1And2: { select: { id: true } },
    statedTotalEmissions: { select: { id: true } },
  },
} satisfies Prisma.EmissionsDefaultArgs

export type DefaultEmissions = Prisma.EmissionsGetPayload<typeof emissionsArgs>

export const economyArgs = {
  include: {
    employees: { select: { id: true } },
    turnover: { select: { id: true } },
  },
} satisfies Prisma.EconomyDefaultArgs

export type DefaultEconomyArgs = Prisma.EconomyGetPayload<typeof economyArgs>

export const reportingPeriodArgs = {
  include: {
    emissions: {
      include: {
        biogenicEmissions: { select: { id: true } },
        scope1: { select: { id: true } },
        scope1And2: { select: { id: true } },
        scope2: { select: { id: true } },
        scope3: { select: { id: true } },
        statedTotalEmissions: { select: { id: true } },
      },
    },
    economy: {
      include: {
        employees: { select: { id: true } },
        turnover: { select: { id: true } },
      },
    },
    company: { select: { wikidataId: true } },
  },
} satisfies Prisma.ReportingPeriodDefaultArgs

export type DefaultReportingPeriod = Prisma.ReportingPeriodGetPayload<
  typeof reportingPeriodArgs
>

export type DefaultGoal = z.infer<typeof goalSchema>

const metadata = {
  orderBy: {
    updatedAt: 'desc' as const,
  },
  take: 1,
  select: {
    comment: true,
    source: true,
    updatedAt: true,
    user: {
      select: {
        name: true,
      },
    },
    verifiedBy: {
      select: {
        name: true,
      },
    },
  },
}

const minimalMetadata = {
  orderBy: {
    updatedAt: 'desc' as const,
  },
  take: 1,
  select: {
    verifiedBy: {
      select: {
        name: true,
      },
    },
  },
}

export const companyResponseArgs = {
  select: {
    wikidataId: true,
    name: true,
    description: true,
    reportingPeriods: {
      select: {
        startDate: true,
        endDate: true,
        reportURL: true,
        economy: {
          select: {
            turnover: {
              select: {
                value: true,
                currency: true,
                metadata: minimalMetadata,
              },
            },
            employees: {
              select: {
                value: true,
                unit: true,
                metadata: minimalMetadata,
              },
            },
          },
        },
        emissions: {
          select: {
            scope1: {
              select: {
                total: true,
                unit: true,
                metadata: minimalMetadata,
              },
            },
            scope2: {
              select: {
                lb: true,
                mb: true,
                unknown: true,
                unit: true,
                metadata: minimalMetadata,
              },
            },
            scope3: {
              select: {
                statedTotalEmissions: {
                  select: {
                    total: true,
                    unit: true,
                    metadata: minimalMetadata,
                  },
                },
                categories: {
                  select: {
                    category: true,
                    total: true,
                    unit: true,
                    metadata: minimalMetadata,
                  },
                  orderBy: {
                    category: 'asc',
                  },
                },
                metadata: minimalMetadata,
              },
            },
            biogenicEmissions: {
              select: {
                total: true,
                unit: true,
                metadata: minimalMetadata,
              },
            },
            scope1And2: {
              select: {
                total: true,
                unit: true,
                metadata: minimalMetadata,
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
        metadata: minimalMetadata,
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
        metadata: minimalMetadata,
      },
    },
  },
} satisfies Prisma.CompanyDefaultArgs

export type CompanyRes = Prisma.CompanyGetPayload<typeof companyResponseArgs>
