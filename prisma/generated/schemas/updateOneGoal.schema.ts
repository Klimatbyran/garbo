import { z } from 'zod'
import { GoalUpdateInputObjectSchema } from './objects/GoalUpdateInput.schema'
import { GoalUncheckedUpdateInputObjectSchema } from './objects/GoalUncheckedUpdateInput.schema'
import { GoalWhereUniqueInputObjectSchema } from './objects/GoalWhereUniqueInput.schema'

export const GoalUpdateOneSchema = z.object({
  data: z.union([
    GoalUpdateInputObjectSchema,
    GoalUncheckedUpdateInputObjectSchema,
  ]),
  where: GoalWhereUniqueInputObjectSchema,
})
