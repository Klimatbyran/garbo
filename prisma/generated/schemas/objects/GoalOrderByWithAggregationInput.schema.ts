import { z } from 'zod'
import { SortOrderSchema } from '../enums/SortOrder.schema'
import { SortOrderInputObjectSchema } from './SortOrderInput.schema'
import { GoalCountOrderByAggregateInputObjectSchema } from './GoalCountOrderByAggregateInput.schema'
import { GoalAvgOrderByAggregateInputObjectSchema } from './GoalAvgOrderByAggregateInput.schema'
import { GoalMaxOrderByAggregateInputObjectSchema } from './GoalMaxOrderByAggregateInput.schema'
import { GoalMinOrderByAggregateInputObjectSchema } from './GoalMinOrderByAggregateInput.schema'
import { GoalSumOrderByAggregateInputObjectSchema } from './GoalSumOrderByAggregateInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.GoalOrderByWithAggregationInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    description: z.lazy(() => SortOrderSchema).optional(),
    year: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputObjectSchema),
      ])
      .optional(),
    target: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputObjectSchema),
      ])
      .optional(),
    baseYear: z.lazy(() => SortOrderSchema).optional(),
    metadataId: z.lazy(() => SortOrderSchema).optional(),
    companyId: z.lazy(() => SortOrderSchema).optional(),
    _count: z.lazy(() => GoalCountOrderByAggregateInputObjectSchema).optional(),
    _avg: z.lazy(() => GoalAvgOrderByAggregateInputObjectSchema).optional(),
    _max: z.lazy(() => GoalMaxOrderByAggregateInputObjectSchema).optional(),
    _min: z.lazy(() => GoalMinOrderByAggregateInputObjectSchema).optional(),
    _sum: z.lazy(() => GoalSumOrderByAggregateInputObjectSchema).optional(),
  })
  .strict()

export const GoalOrderByWithAggregationInputObjectSchema = Schema
