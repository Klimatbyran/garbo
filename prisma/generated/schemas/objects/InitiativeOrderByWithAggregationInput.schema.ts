import { z } from 'zod'
import { SortOrderSchema } from '../enums/SortOrder.schema'
import { SortOrderInputObjectSchema } from './SortOrderInput.schema'
import { InitiativeCountOrderByAggregateInputObjectSchema } from './InitiativeCountOrderByAggregateInput.schema'
import { InitiativeAvgOrderByAggregateInputObjectSchema } from './InitiativeAvgOrderByAggregateInput.schema'
import { InitiativeMaxOrderByAggregateInputObjectSchema } from './InitiativeMaxOrderByAggregateInput.schema'
import { InitiativeMinOrderByAggregateInputObjectSchema } from './InitiativeMinOrderByAggregateInput.schema'
import { InitiativeSumOrderByAggregateInputObjectSchema } from './InitiativeSumOrderByAggregateInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.InitiativeOrderByWithAggregationInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    title: z.lazy(() => SortOrderSchema).optional(),
    description: z.lazy(() => SortOrderSchema).optional(),
    year: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputObjectSchema),
      ])
      .optional(),
    scope: z.lazy(() => SortOrderSchema).optional(),
    companyId: z.lazy(() => SortOrderSchema).optional(),
    metadataId: z.lazy(() => SortOrderSchema).optional(),
    _count: z
      .lazy(() => InitiativeCountOrderByAggregateInputObjectSchema)
      .optional(),
    _avg: z
      .lazy(() => InitiativeAvgOrderByAggregateInputObjectSchema)
      .optional(),
    _max: z
      .lazy(() => InitiativeMaxOrderByAggregateInputObjectSchema)
      .optional(),
    _min: z
      .lazy(() => InitiativeMinOrderByAggregateInputObjectSchema)
      .optional(),
    _sum: z
      .lazy(() => InitiativeSumOrderByAggregateInputObjectSchema)
      .optional(),
  })
  .strict()

export const InitiativeOrderByWithAggregationInputObjectSchema = Schema
