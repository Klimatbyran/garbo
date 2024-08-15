import { z } from 'zod'
import { Scope2CreateWithoutMetadataInputObjectSchema } from './Scope2CreateWithoutMetadataInput.schema'
import { Scope2UncheckedCreateWithoutMetadataInputObjectSchema } from './Scope2UncheckedCreateWithoutMetadataInput.schema'
import { Scope2CreateOrConnectWithoutMetadataInputObjectSchema } from './Scope2CreateOrConnectWithoutMetadataInput.schema'
import { Scope2UpsertWithWhereUniqueWithoutMetadataInputObjectSchema } from './Scope2UpsertWithWhereUniqueWithoutMetadataInput.schema'
import { Scope2WhereUniqueInputObjectSchema } from './Scope2WhereUniqueInput.schema'
import { Scope2UpdateWithWhereUniqueWithoutMetadataInputObjectSchema } from './Scope2UpdateWithWhereUniqueWithoutMetadataInput.schema'
import { Scope2UpdateManyWithWhereWithoutMetadataInputObjectSchema } from './Scope2UpdateManyWithWhereWithoutMetadataInput.schema'
import { Scope2ScalarWhereInputObjectSchema } from './Scope2ScalarWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope2UncheckedUpdateManyWithoutMetadataNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => Scope2CreateWithoutMetadataInputObjectSchema),
          z.lazy(() => Scope2CreateWithoutMetadataInputObjectSchema).array(),
          z.lazy(() => Scope2UncheckedCreateWithoutMetadataInputObjectSchema),
          z
            .lazy(() => Scope2UncheckedCreateWithoutMetadataInputObjectSchema)
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => Scope2CreateOrConnectWithoutMetadataInputObjectSchema),
          z
            .lazy(() => Scope2CreateOrConnectWithoutMetadataInputObjectSchema)
            .array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(
            () => Scope2UpsertWithWhereUniqueWithoutMetadataInputObjectSchema
          ),
          z
            .lazy(
              () => Scope2UpsertWithWhereUniqueWithoutMetadataInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      set: z
        .union([
          z.lazy(() => Scope2WhereUniqueInputObjectSchema),
          z.lazy(() => Scope2WhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => Scope2WhereUniqueInputObjectSchema),
          z.lazy(() => Scope2WhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => Scope2WhereUniqueInputObjectSchema),
          z.lazy(() => Scope2WhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => Scope2WhereUniqueInputObjectSchema),
          z.lazy(() => Scope2WhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(
            () => Scope2UpdateWithWhereUniqueWithoutMetadataInputObjectSchema
          ),
          z
            .lazy(
              () => Scope2UpdateWithWhereUniqueWithoutMetadataInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () => Scope2UpdateManyWithWhereWithoutMetadataInputObjectSchema
          ),
          z
            .lazy(
              () => Scope2UpdateManyWithWhereWithoutMetadataInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => Scope2ScalarWhereInputObjectSchema),
          z.lazy(() => Scope2ScalarWhereInputObjectSchema).array(),
        ])
        .optional(),
    })
    .strict()

export const Scope2UncheckedUpdateManyWithoutMetadataNestedInputObjectSchema =
  Schema
