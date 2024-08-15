import { z } from 'zod'
import { Scope3CategoryCreateWithoutScope3InputObjectSchema } from './Scope3CategoryCreateWithoutScope3Input.schema'
import { Scope3CategoryUncheckedCreateWithoutScope3InputObjectSchema } from './Scope3CategoryUncheckedCreateWithoutScope3Input.schema'
import { Scope3CategoryCreateOrConnectWithoutScope3InputObjectSchema } from './Scope3CategoryCreateOrConnectWithoutScope3Input.schema'
import { Scope3CategoryUpsertWithWhereUniqueWithoutScope3InputObjectSchema } from './Scope3CategoryUpsertWithWhereUniqueWithoutScope3Input.schema'
import { Scope3CategoryWhereUniqueInputObjectSchema } from './Scope3CategoryWhereUniqueInput.schema'
import { Scope3CategoryUpdateWithWhereUniqueWithoutScope3InputObjectSchema } from './Scope3CategoryUpdateWithWhereUniqueWithoutScope3Input.schema'
import { Scope3CategoryUpdateManyWithWhereWithoutScope3InputObjectSchema } from './Scope3CategoryUpdateManyWithWhereWithoutScope3Input.schema'
import { Scope3CategoryScalarWhereInputObjectSchema } from './Scope3CategoryScalarWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CategoryUncheckedUpdateManyWithoutScope3NestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => Scope3CategoryCreateWithoutScope3InputObjectSchema),
          z
            .lazy(() => Scope3CategoryCreateWithoutScope3InputObjectSchema)
            .array(),
          z.lazy(
            () => Scope3CategoryUncheckedCreateWithoutScope3InputObjectSchema
          ),
          z
            .lazy(
              () => Scope3CategoryUncheckedCreateWithoutScope3InputObjectSchema
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () => Scope3CategoryCreateOrConnectWithoutScope3InputObjectSchema
          ),
          z
            .lazy(
              () => Scope3CategoryCreateOrConnectWithoutScope3InputObjectSchema
            )
            .array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(
            () =>
              Scope3CategoryUpsertWithWhereUniqueWithoutScope3InputObjectSchema
          ),
          z
            .lazy(
              () =>
                Scope3CategoryUpsertWithWhereUniqueWithoutScope3InputObjectSchema
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
              Scope3CategoryUpdateWithWhereUniqueWithoutScope3InputObjectSchema
          ),
          z
            .lazy(
              () =>
                Scope3CategoryUpdateWithWhereUniqueWithoutScope3InputObjectSchema
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () =>
              Scope3CategoryUpdateManyWithWhereWithoutScope3InputObjectSchema
          ),
          z
            .lazy(
              () =>
                Scope3CategoryUpdateManyWithWhereWithoutScope3InputObjectSchema
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

export const Scope3CategoryUncheckedUpdateManyWithoutScope3NestedInputObjectSchema =
  Schema
