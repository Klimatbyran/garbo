import { z } from 'zod'
import { Scope3CreateNestedOneWithoutCategoriesInputObjectSchema } from './Scope3CreateNestedOneWithoutCategoriesInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CategoryCreateWithoutMetadataInput> = z
  .object({
    category: z.number(),
    value: z.number().optional().nullable(),
    scope3: z.lazy(
      () => Scope3CreateNestedOneWithoutCategoriesInputObjectSchema
    ),
  })
  .strict()

export const Scope3CategoryCreateWithoutMetadataInputObjectSchema = Schema
