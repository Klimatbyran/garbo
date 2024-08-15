import { z } from 'zod'
import { Scope1CreateWithoutMetadataInputObjectSchema } from './Scope1CreateWithoutMetadataInput.schema'
import { Scope1UncheckedCreateWithoutMetadataInputObjectSchema } from './Scope1UncheckedCreateWithoutMetadataInput.schema'
import { Scope1CreateOrConnectWithoutMetadataInputObjectSchema } from './Scope1CreateOrConnectWithoutMetadataInput.schema'
import { Scope1UpsertWithWhereUniqueWithoutMetadataInputObjectSchema } from './Scope1UpsertWithWhereUniqueWithoutMetadataInput.schema'
import { Scope1WhereUniqueInputObjectSchema } from './Scope1WhereUniqueInput.schema'
import { Scope1UpdateWithWhereUniqueWithoutMetadataInputObjectSchema } from './Scope1UpdateWithWhereUniqueWithoutMetadataInput.schema'
import { Scope1UpdateManyWithWhereWithoutMetadataInputObjectSchema } from './Scope1UpdateManyWithWhereWithoutMetadataInput.schema'
import { Scope1ScalarWhereInputObjectSchema } from './Scope1ScalarWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope1UpdateManyWithoutMetadataNestedInput> = z
  .object({
    create: z
      .union([
        z.lazy(() => Scope1CreateWithoutMetadataInputObjectSchema),
        z.lazy(() => Scope1CreateWithoutMetadataInputObjectSchema).array(),
        z.lazy(() => Scope1UncheckedCreateWithoutMetadataInputObjectSchema),
        z
          .lazy(() => Scope1UncheckedCreateWithoutMetadataInputObjectSchema)
          .array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => Scope1CreateOrConnectWithoutMetadataInputObjectSchema),
        z
          .lazy(() => Scope1CreateOrConnectWithoutMetadataInputObjectSchema)
          .array(),
      ])
      .optional(),
    upsert: z
      .union([
        z.lazy(
          () => Scope1UpsertWithWhereUniqueWithoutMetadataInputObjectSchema
        ),
        z
          .lazy(
            () => Scope1UpsertWithWhereUniqueWithoutMetadataInputObjectSchema
          )
          .array(),
      ])
      .optional(),
    set: z
      .union([
        z.lazy(() => Scope1WhereUniqueInputObjectSchema),
        z.lazy(() => Scope1WhereUniqueInputObjectSchema).array(),
      ])
      .optional(),
    disconnect: z
      .union([
        z.lazy(() => Scope1WhereUniqueInputObjectSchema),
        z.lazy(() => Scope1WhereUniqueInputObjectSchema).array(),
      ])
      .optional(),
    delete: z
      .union([
        z.lazy(() => Scope1WhereUniqueInputObjectSchema),
        z.lazy(() => Scope1WhereUniqueInputObjectSchema).array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => Scope1WhereUniqueInputObjectSchema),
        z.lazy(() => Scope1WhereUniqueInputObjectSchema).array(),
      ])
      .optional(),
    update: z
      .union([
        z.lazy(
          () => Scope1UpdateWithWhereUniqueWithoutMetadataInputObjectSchema
        ),
        z
          .lazy(
            () => Scope1UpdateWithWhereUniqueWithoutMetadataInputObjectSchema
          )
          .array(),
      ])
      .optional(),
    updateMany: z
      .union([
        z.lazy(() => Scope1UpdateManyWithWhereWithoutMetadataInputObjectSchema),
        z
          .lazy(() => Scope1UpdateManyWithWhereWithoutMetadataInputObjectSchema)
          .array(),
      ])
      .optional(),
    deleteMany: z
      .union([
        z.lazy(() => Scope1ScalarWhereInputObjectSchema),
        z.lazy(() => Scope1ScalarWhereInputObjectSchema).array(),
      ])
      .optional(),
  })
  .strict()

export const Scope1UpdateManyWithoutMetadataNestedInputObjectSchema = Schema
