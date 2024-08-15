import { z } from 'zod'
import { FiscalYearWhereInputObjectSchema } from './FiscalYearWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.FiscalYearRelationFilter> = z
  .object({
    is: z
      .lazy(() => FiscalYearWhereInputObjectSchema)
      .optional()
      .nullable(),
    isNot: z
      .lazy(() => FiscalYearWhereInputObjectSchema)
      .optional()
      .nullable(),
  })
  .strict()

export const FiscalYearRelationFilterObjectSchema = Schema
