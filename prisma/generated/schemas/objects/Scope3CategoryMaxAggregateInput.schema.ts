import { z } from 'zod'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CategoryMaxAggregateInputType> = z
  .object({
    id: z.literal(true).optional(),
    category: z.literal(true).optional(),
    value: z.literal(true).optional(),
    scope3Id: z.literal(true).optional(),
    metadataId: z.literal(true).optional(),
  })
  .strict()

export const Scope3CategoryMaxAggregateInputObjectSchema = Schema
