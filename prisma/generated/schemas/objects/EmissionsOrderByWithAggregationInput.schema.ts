import { z } from 'zod'
import { SortOrderSchema } from '../enums/SortOrder.schema'
import { EmissionsCountOrderByAggregateInputObjectSchema } from './EmissionsCountOrderByAggregateInput.schema'
import { EmissionsAvgOrderByAggregateInputObjectSchema } from './EmissionsAvgOrderByAggregateInput.schema'
import { EmissionsMaxOrderByAggregateInputObjectSchema } from './EmissionsMaxOrderByAggregateInput.schema'
import { EmissionsMinOrderByAggregateInputObjectSchema } from './EmissionsMinOrderByAggregateInput.schema'
import { EmissionsSumOrderByAggregateInputObjectSchema } from './EmissionsSumOrderByAggregateInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EmissionsOrderByWithAggregationInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    fiscalYearId: z.lazy(() => SortOrderSchema).optional(),
    scope1Id: z.lazy(() => SortOrderSchema).optional(),
    scope2Id: z.lazy(() => SortOrderSchema).optional(),
    scope3Id: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => EmissionsCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => EmissionsAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => EmissionsMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => EmissionsMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => EmissionsSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict()

export const EmissionsOrderByWithAggregationInputObjectSchema = Schema
