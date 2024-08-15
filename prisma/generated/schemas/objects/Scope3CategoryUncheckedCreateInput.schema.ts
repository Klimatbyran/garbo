import { z } from 'zod'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CategoryUncheckedCreateInput> = z
  .object({
    id: z.number().optional(),
    category: z.number(),
    value: z.number().optional().nullable(),
    scope3Id: z.number(),
    metadataId: z.number(),
  })
  .strict()

export const Scope3CategoryUncheckedCreateInputObjectSchema = Schema
