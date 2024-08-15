import { z } from 'zod'
import { Scope1WhereInputObjectSchema } from './Scope1WhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope1RelationFilter> = z
  .object({
    is: z
      .lazy(() => Scope1WhereInputObjectSchema)
      .optional()
      .nullable(),
    isNot: z
      .lazy(() => Scope1WhereInputObjectSchema)
      .optional()
      .nullable(),
  })
  .strict()

export const Scope1RelationFilterObjectSchema = Schema
