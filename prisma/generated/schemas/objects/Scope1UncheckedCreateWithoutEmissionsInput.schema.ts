import { z } from 'zod'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope1UncheckedCreateWithoutEmissionsInput> = z
  .object({
    id: z.number().optional(),
    value: z.number(),
    biogenic: z.number().optional().nullable(),
    unit: z.string(),
    baseYear: z.string(),
    metadataId: z.number(),
  })
  .strict()

export const Scope1UncheckedCreateWithoutEmissionsInputObjectSchema = Schema
