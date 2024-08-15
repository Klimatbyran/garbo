import { z } from 'zod'
import { GoalCreateWithoutMetadataInputObjectSchema } from './GoalCreateWithoutMetadataInput.schema'
import { GoalUncheckedCreateWithoutMetadataInputObjectSchema } from './GoalUncheckedCreateWithoutMetadataInput.schema'
import { GoalCreateOrConnectWithoutMetadataInputObjectSchema } from './GoalCreateOrConnectWithoutMetadataInput.schema'
import { GoalUpsertWithWhereUniqueWithoutMetadataInputObjectSchema } from './GoalUpsertWithWhereUniqueWithoutMetadataInput.schema'
import { GoalWhereUniqueInputObjectSchema } from './GoalWhereUniqueInput.schema'
import { GoalUpdateWithWhereUniqueWithoutMetadataInputObjectSchema } from './GoalUpdateWithWhereUniqueWithoutMetadataInput.schema'
import { GoalUpdateManyWithWhereWithoutMetadataInputObjectSchema } from './GoalUpdateManyWithWhereWithoutMetadataInput.schema'
import { GoalScalarWhereInputObjectSchema } from './GoalScalarWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.GoalUncheckedUpdateManyWithoutMetadataNestedInput> =
  z
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
      upsert: z
        .union([
          z.lazy(
            () => GoalUpsertWithWhereUniqueWithoutMetadataInputObjectSchema
          ),
          z
            .lazy(
              () => GoalUpsertWithWhereUniqueWithoutMetadataInputObjectSchema
            )
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
          z.lazy(
            () => GoalUpdateWithWhereUniqueWithoutMetadataInputObjectSchema
          ),
          z
            .lazy(
              () => GoalUpdateWithWhereUniqueWithoutMetadataInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(() => GoalUpdateManyWithWhereWithoutMetadataInputObjectSchema),
          z
            .lazy(() => GoalUpdateManyWithWhereWithoutMetadataInputObjectSchema)
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

export const GoalUncheckedUpdateManyWithoutMetadataNestedInputObjectSchema =
  Schema
