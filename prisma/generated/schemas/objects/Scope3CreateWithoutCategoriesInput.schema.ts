import { z } from 'zod'
import { EmissionsCreateNestedOneWithoutScope3InputObjectSchema } from './EmissionsCreateNestedOneWithoutScope3Input.schema'
import { MetadataCreateNestedOneWithoutScope3InputObjectSchema } from './MetadataCreateNestedOneWithoutScope3Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CreateWithoutCategoriesInput> = z
  .object({
    value: z.number().optional().nullable(),
    biogenic: z.number().optional().nullable(),
    unit: z.string(),
    baseYear: z.string(),
    emissions: z.lazy(
      () => EmissionsCreateNestedOneWithoutScope3InputObjectSchema
    ),
    metadata: z.lazy(
      () => MetadataCreateNestedOneWithoutScope3InputObjectSchema
    ),
  })
  .strict()

export const Scope3CreateWithoutCategoriesInputObjectSchema = Schema
