import { z } from 'zod'
import { EconomyWhereInputObjectSchema } from './EconomyWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EconomyRelationFilter> = z
  .object({
    is: z
      .lazy(() => EconomyWhereInputObjectSchema)
      .optional()
      .nullable(),
    isNot: z
      .lazy(() => EconomyWhereInputObjectSchema)
      .optional()
      .nullable(),
  })
  .strict()

export const EconomyRelationFilterObjectSchema = Schema
