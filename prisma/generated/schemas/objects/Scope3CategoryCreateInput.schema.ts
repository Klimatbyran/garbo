import { z } from 'zod'
import { Scope3CreateNestedOneWithoutCategoriesInputObjectSchema } from './Scope3CreateNestedOneWithoutCategoriesInput.schema'
import { MetadataCreateNestedOneWithoutScope3CategoryInputObjectSchema } from './MetadataCreateNestedOneWithoutScope3CategoryInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CategoryCreateInput> = z
  .object({
    category: z.number(),
    value: z.number().optional().nullable(),
    scope3: z.lazy(
      () => Scope3CreateNestedOneWithoutCategoriesInputObjectSchema
    ),
    metadata: z.lazy(
      () => MetadataCreateNestedOneWithoutScope3CategoryInputObjectSchema
    ),
  })
  .strict()

export const Scope3CategoryCreateInputObjectSchema = Schema
