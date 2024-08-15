import { z } from 'zod'
import { SortOrderSchema } from '../enums/SortOrder.schema'
import { SortOrderInputObjectSchema } from './SortOrderInput.schema'
import { FiscalYearOrderByRelationAggregateInputObjectSchema } from './FiscalYearOrderByRelationAggregateInput.schema'
import { InitiativeOrderByRelationAggregateInputObjectSchema } from './InitiativeOrderByRelationAggregateInput.schema'
import { GoalOrderByRelationAggregateInputObjectSchema } from './GoalOrderByRelationAggregateInput.schema'
import { IndustryGicsOrderByWithRelationInputObjectSchema } from './IndustryGicsOrderByWithRelationInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyOrderByWithRelationInput> = z
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
    fiscalYears: z
      .lazy(() => FiscalYearOrderByRelationAggregateInputObjectSchema)
      .optional(),
    initiatives: z
      .lazy(() => InitiativeOrderByRelationAggregateInputObjectSchema)
      .optional(),
    goals: z
      .lazy(() => GoalOrderByRelationAggregateInputObjectSchema)
      .optional(),
    industryGics: z
      .lazy(() => IndustryGicsOrderByWithRelationInputObjectSchema)
      .optional(),
  })
  .strict()

export const CompanyOrderByWithRelationInputObjectSchema = Schema
