import { z } from 'zod'
import { GoalOrderByWithRelationInputObjectSchema } from './objects/GoalOrderByWithRelationInput.schema'
import { GoalWhereInputObjectSchema } from './objects/GoalWhereInput.schema'
import { GoalWhereUniqueInputObjectSchema } from './objects/GoalWhereUniqueInput.schema'
import { GoalScalarFieldEnumSchema } from './enums/GoalScalarFieldEnum.schema'

export const GoalFindFirstSchema = z.object({
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
  distinct: z.array(GoalScalarFieldEnumSchema).optional(),
})
