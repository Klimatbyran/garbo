import { z } from 'zod'
import { SortOrderSchema } from '../enums/SortOrder.schema'
import { SortOrderInputObjectSchema } from './SortOrderInput.schema'
import { FiscalYearCountOrderByAggregateInputObjectSchema } from './FiscalYearCountOrderByAggregateInput.schema'
import { FiscalYearAvgOrderByAggregateInputObjectSchema } from './FiscalYearAvgOrderByAggregateInput.schema'
import { FiscalYearMaxOrderByAggregateInputObjectSchema } from './FiscalYearMaxOrderByAggregateInput.schema'
import { FiscalYearMinOrderByAggregateInputObjectSchema } from './FiscalYearMinOrderByAggregateInput.schema'
import { FiscalYearSumOrderByAggregateInputObjectSchema } from './FiscalYearSumOrderByAggregateInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.FiscalYearOrderByWithAggregationInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    startYear: z.lazy(() => SortOrderSchema).optional(),
    endYear: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputObjectSchema),
      ])
      .optional(),
    startMonth: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputObjectSchema),
      ])
      .optional(),
    companyId: z.lazy(() => SortOrderSchema).optional(),
    emissionsId: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => FiscalYearCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => FiscalYearAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => FiscalYearMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => FiscalYearMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => FiscalYearSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict()

export const FiscalYearOrderByWithAggregationInputObjectSchema = Schema
