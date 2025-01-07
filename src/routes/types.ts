import { Prisma } from '@prisma/client'
import { z } from 'zod'

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

const goalSchema = z.object({
  description: z.string(),
  year: z.string().optional(),
  target: z.number().optional(),
  baseYear: z.string().optional(),
})

export type DefaultGoal = z.infer<typeof goalSchema>
