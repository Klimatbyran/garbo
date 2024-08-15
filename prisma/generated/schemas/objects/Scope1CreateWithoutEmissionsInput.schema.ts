import { z } from 'zod'
import { MetadataCreateNestedOneWithoutScope1InputObjectSchema } from './MetadataCreateNestedOneWithoutScope1Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope1CreateWithoutEmissionsInput> = z
  .object({
    value: z.number(),
    biogenic: z.number().optional().nullable(),
    unit: z.string(),
    baseYear: z.string(),
    metadata: z.lazy(
      () => MetadataCreateNestedOneWithoutScope1InputObjectSchema
    ),
  })
  .strict()

export const Scope1CreateWithoutEmissionsInputObjectSchema = Schema
