import { z } from 'zod'
import { GoalCreateWithoutCompanyInputObjectSchema } from './GoalCreateWithoutCompanyInput.schema'
import { GoalUncheckedCreateWithoutCompanyInputObjectSchema } from './GoalUncheckedCreateWithoutCompanyInput.schema'
import { GoalCreateOrConnectWithoutCompanyInputObjectSchema } from './GoalCreateOrConnectWithoutCompanyInput.schema'
import { GoalUpsertWithWhereUniqueWithoutCompanyInputObjectSchema } from './GoalUpsertWithWhereUniqueWithoutCompanyInput.schema'
import { GoalWhereUniqueInputObjectSchema } from './GoalWhereUniqueInput.schema'
import { GoalUpdateWithWhereUniqueWithoutCompanyInputObjectSchema } from './GoalUpdateWithWhereUniqueWithoutCompanyInput.schema'
import { GoalUpdateManyWithWhereWithoutCompanyInputObjectSchema } from './GoalUpdateManyWithWhereWithoutCompanyInput.schema'
import { GoalScalarWhereInputObjectSchema } from './GoalScalarWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.GoalUpdateManyWithoutCompanyNestedInput> = z
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
    upsert: z
      .union([
        z.lazy(() => GoalUpsertWithWhereUniqueWithoutCompanyInputObjectSchema),
        z
          .lazy(() => GoalUpsertWithWhereUniqueWithoutCompanyInputObjectSchema)
          .array(),
      ])
      .optional(),
    set: z
      .union([
        z.lazy(() => GoalWhereUniqueInputObjectSchema),
        z.lazy(() => GoalWhereUniqueInputObjectSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => GoalWhereUniqueInputObjectSchema),
        z.lazy(() => GoalWhereUniqueInputObjectSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => GoalWhereUniqueInputObjectSchema),
        z.lazy(() => GoalWhereUniqueInputObjectSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => GoalWhereUniqueInputObjectSchema),
        z.lazy(() => GoalWhereUniqueInputObjectSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(() => GoalUpdateWithWhereUniqueWithoutCompanyInputObjectSchema),
        z
          .lazy(() => GoalUpdateWithWhereUniqueWithoutCompanyInputObjectSchema)
          .array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(() => GoalUpdateManyWithWhereWithoutCompanyInputObjectSchema),
        z
          .lazy(() => GoalUpdateManyWithWhereWithoutCompanyInputObjectSchema)
          .array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => GoalScalarWhereInputObjectSchema),
        z.lazy(() => GoalScalarWhereInputObjectSchema).array(),
      ])
      .optional(),
  })
  .strict()

export const GoalUpdateManyWithoutCompanyNestedInputObjectSchema = Schema
