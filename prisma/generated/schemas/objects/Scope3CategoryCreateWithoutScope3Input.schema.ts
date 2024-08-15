import { z } from 'zod'
import { MetadataCreateNestedOneWithoutScope3CategoryInputObjectSchema } from './MetadataCreateNestedOneWithoutScope3CategoryInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CategoryCreateWithoutScope3Input> = z
  .object({
    category: z.number(),
    value: z.number().optional().nullable(),
    metadata: z.lazy(
      () => MetadataCreateNestedOneWithoutScope3CategoryInputObjectSchema
    ),
  })
  .strict()

export const Scope3CategoryCreateWithoutScope3InputObjectSchema = Schema
