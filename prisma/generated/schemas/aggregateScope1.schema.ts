import { z } from 'zod'
import { Scope1OrderByWithRelationInputObjectSchema } from './objects/Scope1OrderByWithRelationInput.schema'
import { Scope1WhereInputObjectSchema } from './objects/Scope1WhereInput.schema'
import { Scope1WhereUniqueInputObjectSchema } from './objects/Scope1WhereUniqueInput.schema'
import { Scope1CountAggregateInputObjectSchema } from './objects/Scope1CountAggregateInput.schema'
import { Scope1MinAggregateInputObjectSchema } from './objects/Scope1MinAggregateInput.schema'
import { Scope1MaxAggregateInputObjectSchema } from './objects/Scope1MaxAggregateInput.schema'
import { Scope1AvgAggregateInputObjectSchema } from './objects/Scope1AvgAggregateInput.schema'
import { Scope1SumAggregateInputObjectSchema } from './objects/Scope1SumAggregateInput.schema'

export const Scope1AggregateSchema = z.object({
  orderBy: z
    .union([
      Scope1OrderByWithRelationInputObjectSchema,
      Scope1OrderByWithRelationInputObjectSchema.array(),
    ])
    .optional(),
  where: Scope1WhereInputObjectSchema.optional(),
  cursor: Scope1WhereUniqueInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  _count: z
    .union([z.literal(true), Scope1CountAggregateInputObjectSchema])
    .optional(),
  _min: Scope1MinAggregateInputObjectSchema.optional(),
  _max: Scope1MaxAggregateInputObjectSchema.optional(),
  _avg: Scope1AvgAggregateInputObjectSchema.optional(),
  _sum: Scope1SumAggregateInputObjectSchema.optional(),
})
