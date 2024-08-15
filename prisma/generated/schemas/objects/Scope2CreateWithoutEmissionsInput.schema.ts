import { z } from 'zod'
import { MetadataCreateNestedOneWithoutScope2InputObjectSchema } from './MetadataCreateNestedOneWithoutScope2Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope2CreateWithoutEmissionsInput> = z
  .object({
    value: z.number(),
    biogenic: z.number().optional().nullable(),
    unit: z.string(),
    mb: z.number().optional().nullable(),
    lb: z.number().optional().nullable(),
    baseYear: z.string(),
    metadata: z.lazy(
      () => MetadataCreateNestedOneWithoutScope2InputObjectSchema
    ),
  })
  .strict()

export const Scope2CreateWithoutEmissionsInputObjectSchema = Schema
