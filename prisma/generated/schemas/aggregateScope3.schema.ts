import { z } from 'zod'
import { Scope3OrderByWithRelationInputObjectSchema } from './objects/Scope3OrderByWithRelationInput.schema'
import { Scope3WhereInputObjectSchema } from './objects/Scope3WhereInput.schema'
import { Scope3WhereUniqueInputObjectSchema } from './objects/Scope3WhereUniqueInput.schema'
import { Scope3CountAggregateInputObjectSchema } from './objects/Scope3CountAggregateInput.schema'
import { Scope3MinAggregateInputObjectSchema } from './objects/Scope3MinAggregateInput.schema'
import { Scope3MaxAggregateInputObjectSchema } from './objects/Scope3MaxAggregateInput.schema'
import { Scope3AvgAggregateInputObjectSchema } from './objects/Scope3AvgAggregateInput.schema'
import { Scope3SumAggregateInputObjectSchema } from './objects/Scope3SumAggregateInput.schema'

export const Scope3AggregateSchema = z.object({
  orderBy: z
    .union([
      Scope3OrderByWithRelationInputObjectSchema,
      Scope3OrderByWithRelationInputObjectSchema.array(),
    ])
    .optional(),
  where: Scope3WhereInputObjectSchema.optional(),
  cursor: Scope3WhereUniqueInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  _count: z
    .union([z.literal(true), Scope3CountAggregateInputObjectSchema])
    .optional(),
  _min: Scope3MinAggregateInputObjectSchema.optional(),
  _max: Scope3MaxAggregateInputObjectSchema.optional(),
  _avg: Scope3AvgAggregateInputObjectSchema.optional(),
  _sum: Scope3SumAggregateInputObjectSchema.optional(),
})
