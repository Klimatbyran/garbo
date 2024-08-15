import { z } from 'zod'
import { SortOrderSchema } from '../enums/SortOrder.schema'
import { IndustryGicsCountOrderByAggregateInputObjectSchema } from './IndustryGicsCountOrderByAggregateInput.schema'
import { IndustryGicsAvgOrderByAggregateInputObjectSchema } from './IndustryGicsAvgOrderByAggregateInput.schema'
import { IndustryGicsMaxOrderByAggregateInputObjectSchema } from './IndustryGicsMaxOrderByAggregateInput.schema'
import { IndustryGicsMinOrderByAggregateInputObjectSchema } from './IndustryGicsMinOrderByAggregateInput.schema'
import { IndustryGicsSumOrderByAggregateInputObjectSchema } from './IndustryGicsSumOrderByAggregateInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.IndustryGicsOrderByWithAggregationInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    name: z.lazy(() => SortOrderSchema).optional(),
    sectorCode: z.lazy(() => SortOrderSchema).optional(),
    sectorName: z.lazy(() => SortOrderSchema).optional(),
    groupCode: z.lazy(() => SortOrderSchema).optional(),
    groupName: z.lazy(() => SortOrderSchema).optional(),
    industryCode: z.lazy(() => SortOrderSchema).optional(),
    industryName: z.lazy(() => SortOrderSchema).optional(),
    subIndustryCode: z.lazy(() => SortOrderSchema).optional(),
    subIndustryName: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => IndustryGicsCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => IndustryGicsAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => IndustryGicsMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => IndustryGicsMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => IndustryGicsSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict()

export const IndustryGicsOrderByWithAggregationInputObjectSchema = Schema
