import { z } from 'zod'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EconomyWhereUniqueInput> = z
  .object({
    id: z.number().optional(),
    fiscalYearId: z.number().optional(),
  })
  .strict()

export const EconomyWhereUniqueInputObjectSchema = Schema
