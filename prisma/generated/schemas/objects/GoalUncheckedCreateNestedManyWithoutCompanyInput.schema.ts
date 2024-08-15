import { z } from 'zod'
import { GoalCreateWithoutCompanyInputObjectSchema } from './GoalCreateWithoutCompanyInput.schema'
import { GoalUncheckedCreateWithoutCompanyInputObjectSchema } from './GoalUncheckedCreateWithoutCompanyInput.schema'
import { GoalCreateOrConnectWithoutCompanyInputObjectSchema } from './GoalCreateOrConnectWithoutCompanyInput.schema'
import { GoalWhereUniqueInputObjectSchema } from './GoalWhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.GoalUncheckedCreateNestedManyWithoutCompanyInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => GoalCreateWithoutCompanyInputObjectSchema),
          z.lazy(() => GoalCreateWithoutCompanyInputObjectSchema).array(),
          z.lazy(() => GoalUncheckedCreateWithoutCompanyInputObjectSchema),
          z
            .lazy(() => GoalUncheckedCreateWithoutCompanyInputObjectSchema)
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => GoalCreateOrConnectWithoutCompanyInputObjectSchema),
          z
            .lazy(() => GoalCreateOrConnectWithoutCompanyInputObjectSchema)
            .array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => GoalWhereUniqueInputObjectSchema),
          z.lazy(() => GoalWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
    })
    .strict()

export const GoalUncheckedCreateNestedManyWithoutCompanyInputObjectSchema =
  Schema
