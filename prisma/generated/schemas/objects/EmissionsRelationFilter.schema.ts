import { z } from 'zod'
import { EmissionsWhereInputObjectSchema } from './EmissionsWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EmissionsRelationFilter> = z
  .object({
    is: z
      .lazy(() => EmissionsWhereInputObjectSchema)
      .optional()
      .nullable(),
    isNot: z
      .lazy(() => EmissionsWhereInputObjectSchema)
      .optional()
      .nullable(),
  })
  .strict()

export const EmissionsRelationFilterObjectSchema = Schema
