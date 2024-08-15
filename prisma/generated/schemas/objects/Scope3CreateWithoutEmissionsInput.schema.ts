import { z } from 'zod'
import { Scope3CategoryCreateNestedManyWithoutScope3InputObjectSchema } from './Scope3CategoryCreateNestedManyWithoutScope3Input.schema'
import { MetadataCreateNestedOneWithoutScope3InputObjectSchema } from './MetadataCreateNestedOneWithoutScope3Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CreateWithoutEmissionsInput> = z
  .object({
    value: z.number().optional().nullable(),
    biogenic: z.number().optional().nullable(),
    unit: z.string(),
    baseYear: z.string(),
    categories: z
      .lazy(() => Scope3CategoryCreateNestedManyWithoutScope3InputObjectSchema)
      .optional(),
    metadata: z.lazy(
      () => MetadataCreateNestedOneWithoutScope3InputObjectSchema
    ),
  })
  .strict()

export const Scope3CreateWithoutEmissionsInputObjectSchema = Schema
