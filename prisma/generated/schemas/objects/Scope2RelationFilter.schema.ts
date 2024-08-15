import { z } from 'zod'
import { Scope2WhereInputObjectSchema } from './Scope2WhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope2RelationFilter> = z
  .object({
    is: z
      .lazy(() => Scope2WhereInputObjectSchema)
      .optional()
      .nullable(),
    isNot: z
      .lazy(() => Scope2WhereInputObjectSchema)
      .optional()
      .nullable(),
  })
  .strict()

export const Scope2RelationFilterObjectSchema = Schema
