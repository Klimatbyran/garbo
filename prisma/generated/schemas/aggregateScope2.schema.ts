import { z } from 'zod'
import { Scope2OrderByWithRelationInputObjectSchema } from './objects/Scope2OrderByWithRelationInput.schema'
import { Scope2WhereInputObjectSchema } from './objects/Scope2WhereInput.schema'
import { Scope2WhereUniqueInputObjectSchema } from './objects/Scope2WhereUniqueInput.schema'
import { Scope2CountAggregateInputObjectSchema } from './objects/Scope2CountAggregateInput.schema'
import { Scope2MinAggregateInputObjectSchema } from './objects/Scope2MinAggregateInput.schema'
import { Scope2MaxAggregateInputObjectSchema } from './objects/Scope2MaxAggregateInput.schema'
import { Scope2AvgAggregateInputObjectSchema } from './objects/Scope2AvgAggregateInput.schema'
import { Scope2SumAggregateInputObjectSchema } from './objects/Scope2SumAggregateInput.schema'

export const Scope2AggregateSchema = z.object({
  orderBy: z
    .union([
      Scope2OrderByWithRelationInputObjectSchema,
      Scope2OrderByWithRelationInputObjectSchema.array(),
    ])
    .optional(),
  where: Scope2WhereInputObjectSchema.optional(),
  cursor: Scope2WhereUniqueInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  _count: z
    .union([z.literal(true), Scope2CountAggregateInputObjectSchema])
    .optional(),
  _min: Scope2MinAggregateInputObjectSchema.optional(),
  _max: Scope2MaxAggregateInputObjectSchema.optional(),
  _avg: Scope2AvgAggregateInputObjectSchema.optional(),
  _sum: Scope2SumAggregateInputObjectSchema.optional(),
})
