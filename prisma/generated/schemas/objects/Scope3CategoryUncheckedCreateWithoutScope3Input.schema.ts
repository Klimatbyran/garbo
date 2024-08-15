import { z } from 'zod'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CategoryUncheckedCreateWithoutScope3Input> =
  z
    .object({
      id: z.number().optional(),
      category: z.number(),
      value: z.number().optional().nullable(),
      metadataId: z.number(),
    })
    .strict()

export const Scope3CategoryUncheckedCreateWithoutScope3InputObjectSchema =
  Schema
