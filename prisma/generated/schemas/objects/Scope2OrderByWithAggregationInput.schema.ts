import { z } from 'zod'
import { SortOrderSchema } from '../enums/SortOrder.schema'
import { SortOrderInputObjectSchema } from './SortOrderInput.schema'
import { Scope2CountOrderByAggregateInputObjectSchema } from './Scope2CountOrderByAggregateInput.schema'
import { Scope2AvgOrderByAggregateInputObjectSchema } from './Scope2AvgOrderByAggregateInput.schema'
import { Scope2MaxOrderByAggregateInputObjectSchema } from './Scope2MaxOrderByAggregateInput.schema'
import { Scope2MinOrderByAggregateInputObjectSchema } from './Scope2MinOrderByAggregateInput.schema'
import { Scope2SumOrderByAggregateInputObjectSchema } from './Scope2SumOrderByAggregateInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope2OrderByWithAggregationInput> = z
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
    mb: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputObjectSchema),
      ])
      .optional(),
    lb: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputObjectSchema),
      ])
      .optional(),
    baseYear: z.lazy(() => SortOrderSchema).optional(),
    metadataId: z.lazy(() => SortOrderSchema).optional(),
    emissionsId: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => Scope2CountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z.lazy(() => Scope2AvgOrderByAggregateInputObjectSchema).optional(),
    _max: z.lazy(() => Scope2MaxOrderByAggregateInputObjectSchema).optional(),
    _min: z.lazy(() => Scope2MinOrderByAggregateInputObjectSchema).optional(),
    _sum: z.lazy(() => Scope2SumOrderByAggregateInputObjectSchema).optional(),
  })
  .strict()

export const Scope2OrderByWithAggregationInputObjectSchema = Schema
