import { Prisma } from '@prisma/client'

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

export type ExtendedEmissions = Prisma.EmissionsGetPayload<typeof emissionsArgs>

export const economyArgs = {
  include: {
    employees: { select: { id: true } },
    turnover: { select: { id: true } },
  },
} satisfies Prisma.EconomyDefaultArgs

export type DefaultEconomyArgs = Prisma.EconomyGetPayload<typeof economyArgs>
