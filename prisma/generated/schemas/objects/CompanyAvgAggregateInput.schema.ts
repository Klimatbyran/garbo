import { z } from 'zod'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyAvgAggregateInputType> = z
  .object({
    id: z.literal(true).optional(),
    industryGicsId: z.literal(true).optional(),
  })
  .strict()

export const CompanyAvgAggregateInputObjectSchema = Schema
