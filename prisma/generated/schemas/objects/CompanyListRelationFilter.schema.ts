import { z } from 'zod'
import { CompanyWhereInputObjectSchema } from './CompanyWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyListRelationFilter> = z
  .object({
    every: z.lazy(() => CompanyWhereInputObjectSchema).optional(),
    some: z.lazy(() => CompanyWhereInputObjectSchema).optional(),
    none: z.lazy(() => CompanyWhereInputObjectSchema).optional(),
  })
  .strict()

export const CompanyListRelationFilterObjectSchema = Schema
