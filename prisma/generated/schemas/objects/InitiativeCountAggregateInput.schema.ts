import { z } from 'zod'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.InitiativeCountAggregateInputType> = z
  .object({
    id: z.literal(true).optional(),
    title: z.literal(true).optional(),
    description: z.literal(true).optional(),
    year: z.literal(true).optional(),
    scope: z.literal(true).optional(),
    companyId: z.literal(true).optional(),
    metadataId: z.literal(true).optional(),
    _all: z.literal(true).optional(),
  })
  .strict()

export const InitiativeCountAggregateInputObjectSchema = Schema
