import { z } from 'zod'
import { Scope3CategoryWhereInputObjectSchema } from './Scope3CategoryWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CategoryListRelationFilter> = z
  .object({
    every: z.lazy(() => Scope3CategoryWhereInputObjectSchema).optional(),
    some: z.lazy(() => Scope3CategoryWhereInputObjectSchema).optional(),
    none: z.lazy(() => Scope3CategoryWhereInputObjectSchema).optional(),
  })
  .strict()

export const Scope3CategoryListRelationFilterObjectSchema = Schema
