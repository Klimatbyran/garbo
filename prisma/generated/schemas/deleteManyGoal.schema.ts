import { z } from 'zod'
import { GoalWhereInputObjectSchema } from './objects/GoalWhereInput.schema'

export const GoalDeleteManySchema = z.object({
  where: GoalWhereInputObjectSchema.optional(),
})
