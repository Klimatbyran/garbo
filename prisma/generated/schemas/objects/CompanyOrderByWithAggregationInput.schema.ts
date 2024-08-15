import { z } from 'zod'
import { SortOrderSchema } from '../enums/SortOrder.schema'
import { SortOrderInputObjectSchema } from './SortOrderInput.schema'
import { CompanyCountOrderByAggregateInputObjectSchema } from './CompanyCountOrderByAggregateInput.schema'
import { CompanyAvgOrderByAggregateInputObjectSchema } from './CompanyAvgOrderByAggregateInput.schema'
import { CompanyMaxOrderByAggregateInputObjectSchema } from './CompanyMaxOrderByAggregateInput.schema'
import { CompanyMinOrderByAggregateInputObjectSchema } from './CompanyMinOrderByAggregateInput.schema'
import { CompanySumOrderByAggregateInputObjectSchema } from './CompanySumOrderByAggregateInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyOrderByWithAggregationInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    name: z.lazy(() => SortOrderSchema).optional(),
    description: z.lazy(() => SortOrderSchema).optional(),
    wikidataId: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputObjectSchema),
      ])
      .optional(),
    url: z.lazy(() => SortOrderSchema).optional(),
    industryGicsId: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputObjectSchema),
      ])
      .optional(),
    _count: z
      .lazy(() => CompanyCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z.lazy(() => CompanyAvgOrderByAggregateInputObjectSchema).optional(),
    _max: z.lazy(() => CompanyMaxOrderByAggregateInputObjectSchema).optional(),
    _min: z.lazy(() => CompanyMinOrderByAggregateInputObjectSchema).optional(),
    _sum: z.lazy(() => CompanySumOrderByAggregateInputObjectSchema).optional(),
  })
  .strict()

export const CompanyOrderByWithAggregationInputObjectSchema = Schema
