import { z } from 'zod'
import { GoalWhereUniqueInputObjectSchema } from './objects/GoalWhereUniqueInput.schema'
import { GoalCreateInputObjectSchema } from './objects/GoalCreateInput.schema'
import { GoalUncheckedCreateInputObjectSchema } from './objects/GoalUncheckedCreateInput.schema'
import { GoalUpdateInputObjectSchema } from './objects/GoalUpdateInput.schema'
import { GoalUncheckedUpdateInputObjectSchema } from './objects/GoalUncheckedUpdateInput.schema'

export const GoalUpsertSchema = z.object({
  where: GoalWhereUniqueInputObjectSchema,
  create: z.union([
    GoalCreateInputObjectSchema,
    GoalUncheckedCreateInputObjectSchema,
  ]),
  update: z.union([
    GoalUpdateInputObjectSchema,
    GoalUncheckedUpdateInputObjectSchema,
  ]),
})
