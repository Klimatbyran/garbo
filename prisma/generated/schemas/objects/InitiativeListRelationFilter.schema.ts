import { z } from 'zod'
import { InitiativeWhereInputObjectSchema } from './InitiativeWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.InitiativeListRelationFilter> = z
  .object({
    every: z.lazy(() => InitiativeWhereInputObjectSchema).optional(),
    some: z.lazy(() => InitiativeWhereInputObjectSchema).optional(),
    none: z.lazy(() => InitiativeWhereInputObjectSchema).optional(),
  })
  .strict()

export const InitiativeListRelationFilterObjectSchema = Schema
