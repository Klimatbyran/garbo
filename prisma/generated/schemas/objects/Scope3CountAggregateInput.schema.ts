import { z } from 'zod'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CountAggregateInputType> = z
  .object({
    id: z.literal(true).optional(),
    value: z.literal(true).optional(),
    biogenic: z.literal(true).optional(),
    unit: z.literal(true).optional(),
    baseYear: z.literal(true).optional(),
    metadataId: z.literal(true).optional(),
    emissionsId: z.literal(true).optional(),
    _all: z.literal(true).optional(),
  })
  .strict()

export const Scope3CountAggregateInputObjectSchema = Schema
