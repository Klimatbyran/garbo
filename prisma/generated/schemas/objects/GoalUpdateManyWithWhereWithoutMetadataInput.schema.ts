import { z } from 'zod'
import { GoalScalarWhereInputObjectSchema } from './GoalScalarWhereInput.schema'
import { GoalUpdateManyMutationInputObjectSchema } from './GoalUpdateManyMutationInput.schema'
import { GoalUncheckedUpdateManyWithoutGoalInputObjectSchema } from './GoalUncheckedUpdateManyWithoutGoalInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.GoalUpdateManyWithWhereWithoutMetadataInput> = z
  .object({
    where: z.lazy(() => GoalScalarWhereInputObjectSchema),
    data: z.union([
      z.lazy(() => GoalUpdateManyMutationInputObjectSchema),
      z.lazy(() => GoalUncheckedUpdateManyWithoutGoalInputObjectSchema),
    ]),
  })
  .strict()

export const GoalUpdateManyWithWhereWithoutMetadataInputObjectSchema = Schema
