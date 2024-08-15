import { z } from 'zod'
import { GoalCreateWithoutMetadataInputObjectSchema } from './GoalCreateWithoutMetadataInput.schema'
import { GoalUncheckedCreateWithoutMetadataInputObjectSchema } from './GoalUncheckedCreateWithoutMetadataInput.schema'
import { GoalCreateOrConnectWithoutMetadataInputObjectSchema } from './GoalCreateOrConnectWithoutMetadataInput.schema'
import { GoalWhereUniqueInputObjectSchema } from './GoalWhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.GoalCreateNestedManyWithoutMetadataInput> = z
  .object({
    create: z
      .union([
        z.lazy(() => GoalCreateWithoutMetadataInputObjectSchema),
        z.lazy(() => GoalCreateWithoutMetadataInputObjectSchema).array(),
        z.lazy(() => GoalUncheckedCreateWithoutMetadataInputObjectSchema),
        z
          .lazy(() => GoalUncheckedCreateWithoutMetadataInputObjectSchema)
          .array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => GoalCreateOrConnectWithoutMetadataInputObjectSchema),
        z
          .lazy(() => GoalCreateOrConnectWithoutMetadataInputObjectSchema)
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

export const GoalCreateNestedManyWithoutMetadataInputObjectSchema = Schema
