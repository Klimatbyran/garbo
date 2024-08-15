import { z } from 'zod'
import { CompanyWhereInputObjectSchema } from './CompanyWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyRelationFilter> = z
  .object({
    is: z
      .lazy(() => CompanyWhereInputObjectSchema)
      .optional()
      .nullable(),
    isNot: z
      .lazy(() => CompanyWhereInputObjectSchema)
      .optional()
      .nullable(),
  })
  .strict()

export const CompanyRelationFilterObjectSchema = Schema
