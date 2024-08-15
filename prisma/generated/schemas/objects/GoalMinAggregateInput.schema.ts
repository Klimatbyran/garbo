import { z } from 'zod'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.GoalMinAggregateInputType> = z
  .object({
    id: z.literal(true).optional(),
    description: z.literal(true).optional(),
    year: z.literal(true).optional(),
    target: z.literal(true).optional(),
    baseYear: z.literal(true).optional(),
    metadataId: z.literal(true).optional(),
    companyId: z.literal(true).optional(),
  })
  .strict()

export const GoalMinAggregateInputObjectSchema = Schema
