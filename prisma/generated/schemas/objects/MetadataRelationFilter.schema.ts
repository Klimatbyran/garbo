import { z } from 'zod'
import { MetadataWhereInputObjectSchema } from './MetadataWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataRelationFilter> = z
  .object({
    is: z
      .lazy(() => MetadataWhereInputObjectSchema)
      .optional()
      .nullable(),
    isNot: z
      .lazy(() => MetadataWhereInputObjectSchema)
      .optional()
      .nullable(),
  })
  .strict()

export const MetadataRelationFilterObjectSchema = Schema
