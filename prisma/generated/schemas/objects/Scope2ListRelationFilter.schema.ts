import { z } from 'zod'
import { Scope2WhereInputObjectSchema } from './Scope2WhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope2ListRelationFilter> = z
  .object({
    every: z.lazy(() => Scope2WhereInputObjectSchema).optional(),
    some: z.lazy(() => Scope2WhereInputObjectSchema).optional(),
    none: z.lazy(() => Scope2WhereInputObjectSchema).optional(),
  })
  .strict()

export const Scope2ListRelationFilterObjectSchema = Schema
