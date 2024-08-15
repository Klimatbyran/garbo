import { z } from 'zod'
import { GoalCreateInputObjectSchema } from './objects/GoalCreateInput.schema'
import { GoalUncheckedCreateInputObjectSchema } from './objects/GoalUncheckedCreateInput.schema'

export const GoalCreateOneSchema = z.object({
  data: z.union([
    GoalCreateInputObjectSchema,
    GoalUncheckedCreateInputObjectSchema,
  ]),
})
