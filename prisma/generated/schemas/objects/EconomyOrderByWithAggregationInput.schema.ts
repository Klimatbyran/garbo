import { z } from 'zod'
import { SortOrderSchema } from '../enums/SortOrder.schema'
import { EconomyCountOrderByAggregateInputObjectSchema } from './EconomyCountOrderByAggregateInput.schema'
import { EconomyAvgOrderByAggregateInputObjectSchema } from './EconomyAvgOrderByAggregateInput.schema'
import { EconomyMaxOrderByAggregateInputObjectSchema } from './EconomyMaxOrderByAggregateInput.schema'
import { EconomyMinOrderByAggregateInputObjectSchema } from './EconomyMinOrderByAggregateInput.schema'
import { EconomySumOrderByAggregateInputObjectSchema } from './EconomySumOrderByAggregateInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EconomyOrderByWithAggregationInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    turnover: z.lazy(() => SortOrderSchema).optional(),
    unit: z.lazy(() => SortOrderSchema).optional(),
    employees: z.lazy(() => SortOrderSchema).optional(),
    metadataId: z.lazy(() => SortOrderSchema).optional(),
    fiscalYearId: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => EconomyCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z.lazy(() => EconomyAvgOrderByAggregateInputObjectSchema).optional(),
    _max: z.lazy(() => EconomyMaxOrderByAggregateInputObjectSchema).optional(),
    _min: z.lazy(() => EconomyMinOrderByAggregateInputObjectSchema).optional(),
    _sum: z.lazy(() => EconomySumOrderByAggregateInputObjectSchema).optional(),
  })
  .strict()

export const EconomyOrderByWithAggregationInputObjectSchema = Schema
