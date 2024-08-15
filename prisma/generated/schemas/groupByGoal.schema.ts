import { z } from 'zod'
import { GoalWhereInputObjectSchema } from './objects/GoalWhereInput.schema'
import { GoalOrderByWithAggregationInputObjectSchema } from './objects/GoalOrderByWithAggregationInput.schema'
import { GoalScalarWhereWithAggregatesInputObjectSchema } from './objects/GoalScalarWhereWithAggregatesInput.schema'
import { GoalScalarFieldEnumSchema } from './enums/GoalScalarFieldEnum.schema'

export const GoalGroupBySchema = z.object({
  where: GoalWhereInputObjectSchema.optional(),
  orderBy: z
    .union([
      GoalOrderByWithAggregationInputObjectSchema,
      GoalOrderByWithAggregationInputObjectSchema.array(),
    ])
    .optional(),
  having: GoalScalarWhereWithAggregatesInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  by: z.array(GoalScalarFieldEnumSchema),
})
