import { z } from 'zod'
import { GoalWhereUniqueInputObjectSchema } from './GoalWhereUniqueInput.schema'
import { GoalCreateWithoutCompanyInputObjectSchema } from './GoalCreateWithoutCompanyInput.schema'
import { GoalUncheckedCreateWithoutCompanyInputObjectSchema } from './GoalUncheckedCreateWithoutCompanyInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.GoalCreateOrConnectWithoutCompanyInput> = z
  .object({
    where: z.lazy(() => GoalWhereUniqueInputObjectSchema),
    create: z.union([
      z.lazy(() => GoalCreateWithoutCompanyInputObjectSchema),
      z.lazy(() => GoalUncheckedCreateWithoutCompanyInputObjectSchema),
    ]),
  })
  .strict()

export const GoalCreateOrConnectWithoutCompanyInputObjectSchema = Schema
