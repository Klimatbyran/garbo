import { z } from 'zod'
import { GoalWhereUniqueInputObjectSchema } from './objects/GoalWhereUniqueInput.schema'

export const GoalFindUniqueSchema = z.object({
  where: GoalWhereUniqueInputObjectSchema,
})
