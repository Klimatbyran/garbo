import { z } from 'zod'
import { SortOrderSchema } from '../enums/SortOrder.schema'
import { SortOrderInputObjectSchema } from './SortOrderInput.schema'
import { GoalOrderByRelationAggregateInputObjectSchema } from './GoalOrderByRelationAggregateInput.schema'
import { InitiativeOrderByRelationAggregateInputObjectSchema } from './InitiativeOrderByRelationAggregateInput.schema'
import { EconomyOrderByRelationAggregateInputObjectSchema } from './EconomyOrderByRelationAggregateInput.schema'
import { Scope1OrderByRelationAggregateInputObjectSchema } from './Scope1OrderByRelationAggregateInput.schema'
import { Scope2OrderByRelationAggregateInputObjectSchema } from './Scope2OrderByRelationAggregateInput.schema'
import { Scope3OrderByRelationAggregateInputObjectSchema } from './Scope3OrderByRelationAggregateInput.schema'
import { Scope3CategoryOrderByRelationAggregateInputObjectSchema } from './Scope3CategoryOrderByRelationAggregateInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataOrderByWithRelationInput> = z
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
    goal: z
      .lazy(() => GoalOrderByRelationAggregateInputObjectSchema)
      .optional(),
    initiative: z
      .lazy(() => InitiativeOrderByRelationAggregateInputObjectSchema)
      .optional(),
    economy: z
      .lazy(() => EconomyOrderByRelationAggregateInputObjectSchema)
      .optional(),
    scope1: z
      .lazy(() => Scope1OrderByRelationAggregateInputObjectSchema)
      .optional(),
    scope2: z
      .lazy(() => Scope2OrderByRelationAggregateInputObjectSchema)
      .optional(),
    scope3: z
      .lazy(() => Scope3OrderByRelationAggregateInputObjectSchema)
      .optional(),
    scope3Category: z
      .lazy(() => Scope3CategoryOrderByRelationAggregateInputObjectSchema)
      .optional(),
  })
  .strict()

export const MetadataOrderByWithRelationInputObjectSchema = Schema
