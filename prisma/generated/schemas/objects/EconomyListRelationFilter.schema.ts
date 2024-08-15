import { z } from 'zod'
import { EconomyWhereInputObjectSchema } from './EconomyWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EconomyListRelationFilter> = z
  .object({
    every: z.lazy(() => EconomyWhereInputObjectSchema).optional(),
    some: z.lazy(() => EconomyWhereInputObjectSchema).optional(),
    none: z.lazy(() => EconomyWhereInputObjectSchema).optional(),
  })
  .strict()

export const EconomyListRelationFilterObjectSchema = Schema
