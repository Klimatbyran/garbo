import { z } from 'zod'
import { GoalWhereInputObjectSchema } from './GoalWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.GoalListRelationFilter> = z
  .object({
    every: z.lazy(() => GoalWhereInputObjectSchema).optional(),
    some: z.lazy(() => GoalWhereInputObjectSchema).optional(),
    none: z.lazy(() => GoalWhereInputObjectSchema).optional(),
  })
  .strict()

export const GoalListRelationFilterObjectSchema = Schema
