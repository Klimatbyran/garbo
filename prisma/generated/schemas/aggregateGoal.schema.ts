import { z } from 'zod'
import { GoalOrderByWithRelationInputObjectSchema } from './objects/GoalOrderByWithRelationInput.schema'
import { GoalWhereInputObjectSchema } from './objects/GoalWhereInput.schema'
import { GoalWhereUniqueInputObjectSchema } from './objects/GoalWhereUniqueInput.schema'
import { GoalCountAggregateInputObjectSchema } from './objects/GoalCountAggregateInput.schema'
import { GoalMinAggregateInputObjectSchema } from './objects/GoalMinAggregateInput.schema'
import { GoalMaxAggregateInputObjectSchema } from './objects/GoalMaxAggregateInput.schema'
import { GoalAvgAggregateInputObjectSchema } from './objects/GoalAvgAggregateInput.schema'
import { GoalSumAggregateInputObjectSchema } from './objects/GoalSumAggregateInput.schema'

export const GoalAggregateSchema = z.object({
  orderBy: z
    .union([
      GoalOrderByWithRelationInputObjectSchema,
      GoalOrderByWithRelationInputObjectSchema.array(),
    ])
    .optional(),
  where: GoalWhereInputObjectSchema.optional(),
  cursor: GoalWhereUniqueInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  _count: z
    .union([z.literal(true), GoalCountAggregateInputObjectSchema])
    .optional(),
  _min: GoalMinAggregateInputObjectSchema.optional(),
  _max: GoalMaxAggregateInputObjectSchema.optional(),
  _avg: GoalAvgAggregateInputObjectSchema.optional(),
  _sum: GoalSumAggregateInputObjectSchema.optional(),
})
