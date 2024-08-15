import { z } from 'zod'
import { EconomyCreateWithoutMetadataInputObjectSchema } from './EconomyCreateWithoutMetadataInput.schema'
import { EconomyUncheckedCreateWithoutMetadataInputObjectSchema } from './EconomyUncheckedCreateWithoutMetadataInput.schema'
import { EconomyCreateOrConnectWithoutMetadataInputObjectSchema } from './EconomyCreateOrConnectWithoutMetadataInput.schema'
import { EconomyUpsertWithWhereUniqueWithoutMetadataInputObjectSchema } from './EconomyUpsertWithWhereUniqueWithoutMetadataInput.schema'
import { EconomyWhereUniqueInputObjectSchema } from './EconomyWhereUniqueInput.schema'
import { EconomyUpdateWithWhereUniqueWithoutMetadataInputObjectSchema } from './EconomyUpdateWithWhereUniqueWithoutMetadataInput.schema'
import { EconomyUpdateManyWithWhereWithoutMetadataInputObjectSchema } from './EconomyUpdateManyWithWhereWithoutMetadataInput.schema'
import { EconomyScalarWhereInputObjectSchema } from './EconomyScalarWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EconomyUncheckedUpdateManyWithoutMetadataNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => EconomyCreateWithoutMetadataInputObjectSchema),
          z.lazy(() => EconomyCreateWithoutMetadataInputObjectSchema).array(),
          z.lazy(() => EconomyUncheckedCreateWithoutMetadataInputObjectSchema),
          z
            .lazy(() => EconomyUncheckedCreateWithoutMetadataInputObjectSchema)
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => EconomyCreateOrConnectWithoutMetadataInputObjectSchema),
          z
            .lazy(() => EconomyCreateOrConnectWithoutMetadataInputObjectSchema)
            .array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(
            () => EconomyUpsertWithWhereUniqueWithoutMetadataInputObjectSchema
          ),
          z
            .lazy(
              () => EconomyUpsertWithWhereUniqueWithoutMetadataInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      set: z
        .union([
          z.lazy(() => EconomyWhereUniqueInputObjectSchema),
          z.lazy(() => EconomyWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => EconomyWhereUniqueInputObjectSchema),
          z.lazy(() => EconomyWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => EconomyWhereUniqueInputObjectSchema),
          z.lazy(() => EconomyWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => EconomyWhereUniqueInputObjectSchema),
          z.lazy(() => EconomyWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(
            () => EconomyUpdateWithWhereUniqueWithoutMetadataInputObjectSchema
          ),
          z
            .lazy(
              () => EconomyUpdateWithWhereUniqueWithoutMetadataInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () => EconomyUpdateManyWithWhereWithoutMetadataInputObjectSchema
          ),
          z
            .lazy(
              () => EconomyUpdateManyWithWhereWithoutMetadataInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => EconomyScalarWhereInputObjectSchema),
          z.lazy(() => EconomyScalarWhereInputObjectSchema).array(),
        ])
        .optional(),
    })
    .strict()

export const EconomyUncheckedUpdateManyWithoutMetadataNestedInputObjectSchema =
  Schema
