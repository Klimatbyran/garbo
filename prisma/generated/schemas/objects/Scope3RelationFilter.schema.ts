import { z } from 'zod'
import { Scope3WhereInputObjectSchema } from './Scope3WhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3RelationFilter> = z
  .object({
    is: z
      .lazy(() => Scope3WhereInputObjectSchema)
      .optional()
      .nullable(),
    isNot: z
      .lazy(() => Scope3WhereInputObjectSchema)
      .optional()
      .nullable(),
  })
  .strict()

export const Scope3RelationFilterObjectSchema = Schema
