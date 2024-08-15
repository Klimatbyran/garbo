import { z } from 'zod'
import { SortOrderSchema } from '../enums/SortOrder.schema'
import { SortOrderInputObjectSchema } from './SortOrderInput.schema'
import { Scope3CountOrderByAggregateInputObjectSchema } from './Scope3CountOrderByAggregateInput.schema'
import { Scope3AvgOrderByAggregateInputObjectSchema } from './Scope3AvgOrderByAggregateInput.schema'
import { Scope3MaxOrderByAggregateInputObjectSchema } from './Scope3MaxOrderByAggregateInput.schema'
import { Scope3MinOrderByAggregateInputObjectSchema } from './Scope3MinOrderByAggregateInput.schema'
import { Scope3SumOrderByAggregateInputObjectSchema } from './Scope3SumOrderByAggregateInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3OrderByWithAggregationInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    value: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputObjectSchema),
      ])
      .optional(),
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
      .lazy(() => Scope3CountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z.lazy(() => Scope3AvgOrderByAggregateInputObjectSchema).optional(),
    _max: z.lazy(() => Scope3MaxOrderByAggregateInputObjectSchema).optional(),
    _min: z.lazy(() => Scope3MinOrderByAggregateInputObjectSchema).optional(),
    _sum: z.lazy(() => Scope3SumOrderByAggregateInputObjectSchema).optional(),
  })
  .strict()

export const Scope3OrderByWithAggregationInputObjectSchema = Schema
