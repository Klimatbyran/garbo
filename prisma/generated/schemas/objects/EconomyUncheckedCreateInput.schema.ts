import { z } from 'zod'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EconomyUncheckedCreateInput> = z
  .object({
    id: z.number().optional(),
    turnover: z.number(),
    unit: z.string(),
    employees: z.number(),
    metadataId: z.number(),
    fiscalYearId: z.number(),
  })
  .strict()

export const EconomyUncheckedCreateInputObjectSchema = Schema
