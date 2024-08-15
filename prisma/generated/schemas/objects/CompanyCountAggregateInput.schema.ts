import { z } from 'zod'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyCountAggregateInputType> = z
  .object({
    id: z.literal(true).optional(),
    name: z.literal(true).optional(),
    description: z.literal(true).optional(),
    wikidataId: z.literal(true).optional(),
    url: z.literal(true).optional(),
    industryGicsId: z.literal(true).optional(),
    _all: z.literal(true).optional(),
  })
  .strict()

export const CompanyCountAggregateInputObjectSchema = Schema
