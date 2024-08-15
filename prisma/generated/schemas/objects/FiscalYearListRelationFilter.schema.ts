import { z } from 'zod'
import { FiscalYearWhereInputObjectSchema } from './FiscalYearWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.FiscalYearListRelationFilter> = z
  .object({
    every: z.lazy(() => FiscalYearWhereInputObjectSchema).optional(),
    some: z.lazy(() => FiscalYearWhereInputObjectSchema).optional(),
    none: z.lazy(() => FiscalYearWhereInputObjectSchema).optional(),
  })
  .strict()

export const FiscalYearListRelationFilterObjectSchema = Schema
