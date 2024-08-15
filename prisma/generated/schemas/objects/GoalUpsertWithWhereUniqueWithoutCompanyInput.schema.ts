import { z } from 'zod'
import { GoalWhereUniqueInputObjectSchema } from './GoalWhereUniqueInput.schema'
import { GoalUpdateWithoutCompanyInputObjectSchema } from './GoalUpdateWithoutCompanyInput.schema'
import { GoalUncheckedUpdateWithoutCompanyInputObjectSchema } from './GoalUncheckedUpdateWithoutCompanyInput.schema'
import { GoalCreateWithoutCompanyInputObjectSchema } from './GoalCreateWithoutCompanyInput.schema'
import { GoalUncheckedCreateWithoutCompanyInputObjectSchema } from './GoalUncheckedCreateWithoutCompanyInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.GoalUpsertWithWhereUniqueWithoutCompanyInput> = z
  .object({
    where: z.lazy(() => GoalWhereUniqueInputObjectSchema),
    update: z.union([
      z.lazy(() => GoalUpdateWithoutCompanyInputObjectSchema),
      z.lazy(() => GoalUncheckedUpdateWithoutCompanyInputObjectSchema),
    ]),
    create: z.union([
      z.lazy(() => GoalCreateWithoutCompanyInputObjectSchema),
      z.lazy(() => GoalUncheckedCreateWithoutCompanyInputObjectSchema),
    ]),
  })
  .strict()

export const GoalUpsertWithWhereUniqueWithoutCompanyInputObjectSchema = Schema
