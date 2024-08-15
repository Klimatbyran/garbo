import { z } from 'zod'
import { GoalWhereUniqueInputObjectSchema } from './objects/GoalWhereUniqueInput.schema'

export const GoalDeleteOneSchema = z.object({
  where: GoalWhereUniqueInputObjectSchema,
})
