import { z } from 'zod'
import { SortOrderSchema } from '../enums/SortOrder.schema'
import { SortOrderInputObjectSchema } from './SortOrderInput.schema'
import { Scope1CountOrderByAggregateInputObjectSchema } from './Scope1CountOrderByAggregateInput.schema'
import { Scope1AvgOrderByAggregateInputObjectSchema } from './Scope1AvgOrderByAggregateInput.schema'
import { Scope1MaxOrderByAggregateInputObjectSchema } from './Scope1MaxOrderByAggregateInput.schema'
import { Scope1MinOrderByAggregateInputObjectSchema } from './Scope1MinOrderByAggregateInput.schema'
import { Scope1SumOrderByAggregateInputObjectSchema } from './Scope1SumOrderByAggregateInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope1OrderByWithAggregationInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    value: z.lazy(() => SortOrderSchema).optional(),
    biogenic: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputObjectSchema),
      ])
      .optional(),
    unit: z.lazy(() => SortOrderSchema).optional(),
    baseYear: z.lazy(() => SortOrderSchema).optional(),
    metadataId: z.lazy(() => SortOrderSchema).optional(),
    emissionsId: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => Scope1CountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z.lazy(() => Scope1AvgOrderByAggregateInputObjectSchema).optional(),
    _max: z.lazy(() => Scope1MaxOrderByAggregateInputObjectSchema).optional(),
    _min: z.lazy(() => Scope1MinOrderByAggregateInputObjectSchema).optional(),
    _sum: z.lazy(() => Scope1SumOrderByAggregateInputObjectSchema).optional(),
  })
  .strict()

export const Scope1OrderByWithAggregationInputObjectSchema = Schema
