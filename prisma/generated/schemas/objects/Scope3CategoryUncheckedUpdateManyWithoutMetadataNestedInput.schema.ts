import { z } from 'zod'
import { Scope3CategoryCreateWithoutMetadataInputObjectSchema } from './Scope3CategoryCreateWithoutMetadataInput.schema'
import { Scope3CategoryUncheckedCreateWithoutMetadataInputObjectSchema } from './Scope3CategoryUncheckedCreateWithoutMetadataInput.schema'
import { Scope3CategoryCreateOrConnectWithoutMetadataInputObjectSchema } from './Scope3CategoryCreateOrConnectWithoutMetadataInput.schema'
import { Scope3CategoryUpsertWithWhereUniqueWithoutMetadataInputObjectSchema } from './Scope3CategoryUpsertWithWhereUniqueWithoutMetadataInput.schema'
import { Scope3CategoryWhereUniqueInputObjectSchema } from './Scope3CategoryWhereUniqueInput.schema'
import { Scope3CategoryUpdateWithWhereUniqueWithoutMetadataInputObjectSchema } from './Scope3CategoryUpdateWithWhereUniqueWithoutMetadataInput.schema'
import { Scope3CategoryUpdateManyWithWhereWithoutMetadataInputObjectSchema } from './Scope3CategoryUpdateManyWithWhereWithoutMetadataInput.schema'
import { Scope3CategoryScalarWhereInputObjectSchema } from './Scope3CategoryScalarWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CategoryUncheckedUpdateManyWithoutMetadataNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => Scope3CategoryCreateWithoutMetadataInputObjectSchema),
          z
            .lazy(() => Scope3CategoryCreateWithoutMetadataInputObjectSchema)
            .array(),
          z.lazy(
            () => Scope3CategoryUncheckedCreateWithoutMetadataInputObjectSchema
          ),
          z
            .lazy(
              () =>
                Scope3CategoryUncheckedCreateWithoutMetadataInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () => Scope3CategoryCreateOrConnectWithoutMetadataInputObjectSchema
          ),
          z
            .lazy(
              () =>
                Scope3CategoryCreateOrConnectWithoutMetadataInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(
            () =>
              Scope3CategoryUpsertWithWhereUniqueWithoutMetadataInputObjectSchema
          ),
          z
            .lazy(
              () =>
                Scope3CategoryUpsertWithWhereUniqueWithoutMetadataInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      set: z
        .union([
          z.lazy(() => Scope3CategoryWhereUniqueInputObjectSchema),
          z.lazy(() => Scope3CategoryWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => Scope3CategoryWhereUniqueInputObjectSchema),
          z.lazy(() => Scope3CategoryWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => Scope3CategoryWhereUniqueInputObjectSchema),
          z.lazy(() => Scope3CategoryWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => Scope3CategoryWhereUniqueInputObjectSchema),
          z.lazy(() => Scope3CategoryWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(
            () =>
              Scope3CategoryUpdateWithWhereUniqueWithoutMetadataInputObjectSchema
          ),
          z
            .lazy(
              () =>
                Scope3CategoryUpdateWithWhereUniqueWithoutMetadataInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () =>
              Scope3CategoryUpdateManyWithWhereWithoutMetadataInputObjectSchema
          ),
          z
            .lazy(
              () =>
                Scope3CategoryUpdateManyWithWhereWithoutMetadataInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => Scope3CategoryScalarWhereInputObjectSchema),
          z.lazy(() => Scope3CategoryScalarWhereInputObjectSchema).array(),
        ])
        .optional(),
    })
    .strict()

export const Scope3CategoryUncheckedUpdateManyWithoutMetadataNestedInputObjectSchema =
  Schema
