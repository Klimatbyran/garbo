import { z } from 'zod'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.InitiativeSumAggregateInputType> = z
  .object({
    id: z.literal(true).optional(),
    companyId: z.literal(true).optional(),
    metadataId: z.literal(true).optional(),
  })
  .strict()

export const InitiativeSumAggregateInputObjectSchema = Schema
