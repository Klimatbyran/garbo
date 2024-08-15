import { z } from 'zod'
import { Scope3CategoryUncheckedCreateNestedManyWithoutScope3InputObjectSchema } from './Scope3CategoryUncheckedCreateNestedManyWithoutScope3Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3UncheckedCreateWithoutMetadataInput> = z
  .object({
    id: z.number().optional(),
    value: z.number().optional().nullable(),
    biogenic: z.number().optional().nullable(),
    unit: z.string(),
    baseYear: z.string(),
    emissionsId: z.number(),
    categories: z
      .lazy(
        () =>
          Scope3CategoryUncheckedCreateNestedManyWithoutScope3InputObjectSchema
      )
      .optional(),
  })
  .strict()

export const Scope3UncheckedCreateWithoutMetadataInputObjectSchema = Schema
