import { z } from 'zod'
import { SortOrderSchema } from '../enums/SortOrder.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanySumOrderByAggregateInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    industryGicsId: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict()

export const CompanySumOrderByAggregateInputObjectSchema = Schema
