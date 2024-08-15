import { z } from 'zod'
import { SortOrderSchema } from '../enums/SortOrder.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EmissionsMinOrderByAggregateInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    fiscalYearId: z.lazy(() => SortOrderSchema).optional(),
    scope1Id: z.lazy(() => SortOrderSchema).optional(),
    scope2Id: z.lazy(() => SortOrderSchema).optional(),
    scope3Id: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict()

export const EmissionsMinOrderByAggregateInputObjectSchema = Schema
