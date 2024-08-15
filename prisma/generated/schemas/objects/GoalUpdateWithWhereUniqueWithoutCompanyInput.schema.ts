import { z } from 'zod'
import { GoalWhereUniqueInputObjectSchema } from './GoalWhereUniqueInput.schema'
import { GoalUpdateWithoutCompanyInputObjectSchema } from './GoalUpdateWithoutCompanyInput.schema'
import { GoalUncheckedUpdateWithoutCompanyInputObjectSchema } from './GoalUncheckedUpdateWithoutCompanyInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.GoalUpdateWithWhereUniqueWithoutCompanyInput> = z
  .object({
    where: z.lazy(() => GoalWhereUniqueInputObjectSchema),
    data: z.union([
      z.lazy(() => GoalUpdateWithoutCompanyInputObjectSchema),
      z.lazy(() => GoalUncheckedUpdateWithoutCompanyInputObjectSchema),
    ]),
  })
  .strict()

export const GoalUpdateWithWhereUniqueWithoutCompanyInputObjectSchema = Schema
