import { z } from 'zod'
import { GoalScalarWhereInputObjectSchema } from './GoalScalarWhereInput.schema'
import { GoalUpdateManyMutationInputObjectSchema } from './GoalUpdateManyMutationInput.schema'
import { GoalUncheckedUpdateManyWithoutGoalsInputObjectSchema } from './GoalUncheckedUpdateManyWithoutGoalsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.GoalUpdateManyWithWhereWithoutCompanyInput> = z
  .object({
    where: z.lazy(() => GoalScalarWhereInputObjectSchema),
    data: z.union([
      z.lazy(() => GoalUpdateManyMutationInputObjectSchema),
      z.lazy(() => GoalUncheckedUpdateManyWithoutGoalsInputObjectSchema),
    ]),
  })
  .strict()

export const GoalUpdateManyWithWhereWithoutCompanyInputObjectSchema = Schema
