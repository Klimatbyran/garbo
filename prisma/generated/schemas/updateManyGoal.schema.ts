import { z } from 'zod'
import { GoalUpdateManyMutationInputObjectSchema } from './objects/GoalUpdateManyMutationInput.schema'
import { GoalWhereInputObjectSchema } from './objects/GoalWhereInput.schema'

export const GoalUpdateManySchema = z.object({
  data: GoalUpdateManyMutationInputObjectSchema,
  where: GoalWhereInputObjectSchema.optional(),
})
