import { z } from 'zod'
import { SortOrderSchema } from '../enums/SortOrder.schema'
import { SortOrderInputObjectSchema } from './SortOrderInput.schema'
import { Scope3CategoryCountOrderByAggregateInputObjectSchema } from './Scope3CategoryCountOrderByAggregateInput.schema'
import { Scope3CategoryAvgOrderByAggregateInputObjectSchema } from './Scope3CategoryAvgOrderByAggregateInput.schema'
import { Scope3CategoryMaxOrderByAggregateInputObjectSchema } from './Scope3CategoryMaxOrderByAggregateInput.schema'
import { Scope3CategoryMinOrderByAggregateInputObjectSchema } from './Scope3CategoryMinOrderByAggregateInput.schema'
import { Scope3CategorySumOrderByAggregateInputObjectSchema } from './Scope3CategorySumOrderByAggregateInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CategoryOrderByWithAggregationInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    category: z.lazy(() => SortOrderSchema).optional(),
    value: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputObjectSchema),
      ])
      .optional(),
    scope3Id: z.lazy(() => SortOrderSchema).optional(),
    metadataId: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => Scope3CategoryCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => Scope3CategoryAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => Scope3CategoryMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => Scope3CategoryMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => Scope3CategorySumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict()

export const Scope3CategoryOrderByWithAggregationInputObjectSchema = Schema
