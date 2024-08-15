import { z } from 'zod'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EconomyUncheckedCreateWithoutMetadataInput> = z
  .object({
    id: z.number().optional(),
    turnover: z.number(),
    unit: z.string(),
    employees: z.number(),
    fiscalYearId: z.number(),
  })
  .strict()

export const EconomyUncheckedCreateWithoutMetadataInputObjectSchema = Schema
