import { z } from 'zod'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.FiscalYearMaxAggregateInputType> = z
  .object({
    id: z.literal(true).optional(),
    startYear: z.literal(true).optional(),
    endYear: z.literal(true).optional(),
    startMonth: z.literal(true).optional(),
    companyId: z.literal(true).optional(),
    emissionsId: z.literal(true).optional(),
  })
  .strict()

export const FiscalYearMaxAggregateInputObjectSchema = Schema
