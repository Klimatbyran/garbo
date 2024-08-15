import { z } from 'zod'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataCountAggregateInputType> = z
  .object({
    id: z.literal(true).optional(),
    url: z.literal(true).optional(),
    comment: z.literal(true).optional(),
    userId: z.literal(true).optional(),
    lastUpdated: z.literal(true).optional(),
    _all: z.literal(true).optional(),
  })
  .strict()

export const MetadataCountAggregateInputObjectSchema = Schema
