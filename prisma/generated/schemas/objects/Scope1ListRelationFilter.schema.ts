import { z } from 'zod'
import { Scope1WhereInputObjectSchema } from './Scope1WhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope1ListRelationFilter> = z
  .object({
    every: z.lazy(() => Scope1WhereInputObjectSchema).optional(),
    some: z.lazy(() => Scope1WhereInputObjectSchema).optional(),
    none: z.lazy(() => Scope1WhereInputObjectSchema).optional(),
  })
  .strict()

export const Scope1ListRelationFilterObjectSchema = Schema
