import { z } from 'zod'
import { SortOrderSchema } from '../enums/SortOrder.schema'
import { SortOrderInputObjectSchema } from './SortOrderInput.schema'
import { MetadataCountOrderByAggregateInputObjectSchema } from './MetadataCountOrderByAggregateInput.schema'
import { MetadataAvgOrderByAggregateInputObjectSchema } from './MetadataAvgOrderByAggregateInput.schema'
import { MetadataMaxOrderByAggregateInputObjectSchema } from './MetadataMaxOrderByAggregateInput.schema'
import { MetadataMinOrderByAggregateInputObjectSchema } from './MetadataMinOrderByAggregateInput.schema'
import { MetadataSumOrderByAggregateInputObjectSchema } from './MetadataSumOrderByAggregateInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataOrderByWithAggregationInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    url: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputObjectSchema),
      ])
      .optional(),
    comment: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputObjectSchema),
      ])
      .optional(),
    userId: z.lazy(() => SortOrderSchema).optional(),
    lastUpdated: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => MetadataCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z.lazy(() => MetadataAvgOrderByAggregateInputObjectSchema).optional(),
    _max: z.lazy(() => MetadataMaxOrderByAggregateInputObjectSchema).optional(),
    _min: z.lazy(() => MetadataMinOrderByAggregateInputObjectSchema).optional(),
    _sum: z.lazy(() => MetadataSumOrderByAggregateInputObjectSchema).optional(),
  })
  .strict()

export const MetadataOrderByWithAggregationInputObjectSchema = Schema
