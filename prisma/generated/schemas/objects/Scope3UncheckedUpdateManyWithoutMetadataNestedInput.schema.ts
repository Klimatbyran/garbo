import { z } from 'zod'
import { Scope3CreateWithoutMetadataInputObjectSchema } from './Scope3CreateWithoutMetadataInput.schema'
import { Scope3UncheckedCreateWithoutMetadataInputObjectSchema } from './Scope3UncheckedCreateWithoutMetadataInput.schema'
import { Scope3CreateOrConnectWithoutMetadataInputObjectSchema } from './Scope3CreateOrConnectWithoutMetadataInput.schema'
import { Scope3UpsertWithWhereUniqueWithoutMetadataInputObjectSchema } from './Scope3UpsertWithWhereUniqueWithoutMetadataInput.schema'
import { Scope3WhereUniqueInputObjectSchema } from './Scope3WhereUniqueInput.schema'
import { Scope3UpdateWithWhereUniqueWithoutMetadataInputObjectSchema } from './Scope3UpdateWithWhereUniqueWithoutMetadataInput.schema'
import { Scope3UpdateManyWithWhereWithoutMetadataInputObjectSchema } from './Scope3UpdateManyWithWhereWithoutMetadataInput.schema'
import { Scope3ScalarWhereInputObjectSchema } from './Scope3ScalarWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3UncheckedUpdateManyWithoutMetadataNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => Scope3CreateWithoutMetadataInputObjectSchema),
          z.lazy(() => Scope3CreateWithoutMetadataInputObjectSchema).array(),
          z.lazy(() => Scope3UncheckedCreateWithoutMetadataInputObjectSchema),
          z
            .lazy(() => Scope3UncheckedCreateWithoutMetadataInputObjectSchema)
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => Scope3CreateOrConnectWithoutMetadataInputObjectSchema),
          z
            .lazy(() => Scope3CreateOrConnectWithoutMetadataInputObjectSchema)
            .array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(
            () => Scope3UpsertWithWhereUniqueWithoutMetadataInputObjectSchema
          ),
          z
            .lazy(
              () => Scope3UpsertWithWhereUniqueWithoutMetadataInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      set: z
        .union([
          z.lazy(() => Scope3WhereUniqueInputObjectSchema),
          z.lazy(() => Scope3WhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => Scope3WhereUniqueInputObjectSchema),
          z.lazy(() => Scope3WhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => Scope3WhereUniqueInputObjectSchema),
          z.lazy(() => Scope3WhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => Scope3WhereUniqueInputObjectSchema),
          z.lazy(() => Scope3WhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(
            () => Scope3UpdateWithWhereUniqueWithoutMetadataInputObjectSchema
          ),
          z
            .lazy(
              () => Scope3UpdateWithWhereUniqueWithoutMetadataInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () => Scope3UpdateManyWithWhereWithoutMetadataInputObjectSchema
          ),
          z
            .lazy(
              () => Scope3UpdateManyWithWhereWithoutMetadataInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => Scope3ScalarWhereInputObjectSchema),
          z.lazy(() => Scope3ScalarWhereInputObjectSchema).array(),
        ])
        .optional(),
    })
    .strict()

export const Scope3UncheckedUpdateManyWithoutMetadataNestedInputObjectSchema =
  Schema
