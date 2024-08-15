import { z } from 'zod'
import { Scope3WhereInputObjectSchema } from './Scope3WhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3ListRelationFilter> = z
  .object({
    every: z.lazy(() => Scope3WhereInputObjectSchema).optional(),
    some: z.lazy(() => Scope3WhereInputObjectSchema).optional(),
    none: z.lazy(() => Scope3WhereInputObjectSchema).optional(),
  })
  .strict()

export const Scope3ListRelationFilterObjectSchema = Schema
