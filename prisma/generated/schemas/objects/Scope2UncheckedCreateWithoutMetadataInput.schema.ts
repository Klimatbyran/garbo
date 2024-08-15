import { z } from 'zod'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope2UncheckedCreateWithoutMetadataInput> = z
  .object({
    id: z.number().optional(),
    value: z.number(),
    biogenic: z.number().optional().nullable(),
    unit: z.string(),
    mb: z.number().optional().nullable(),
    lb: z.number().optional().nullable(),
    baseYear: z.string(),
    emissionsId: z.number(),
  })
  .strict()

export const Scope2UncheckedCreateWithoutMetadataInputObjectSchema = Schema
