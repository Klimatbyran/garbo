import { z } from 'zod'
import { IndustryGicsWhereInputObjectSchema } from './IndustryGicsWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.IndustryGicsRelationFilter> = z
  .object({
    is: z
      .lazy(() => IndustryGicsWhereInputObjectSchema)
      .optional()
      .nullable(),
    isNot: z
      .lazy(() => IndustryGicsWhereInputObjectSchema)
      .optional()
      .nullable(),
  })
  .strict()

export const IndustryGicsRelationFilterObjectSchema = Schema
