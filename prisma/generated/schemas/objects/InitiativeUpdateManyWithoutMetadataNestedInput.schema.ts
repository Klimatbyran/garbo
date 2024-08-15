import { z } from 'zod'
import { InitiativeCreateWithoutMetadataInputObjectSchema } from './InitiativeCreateWithoutMetadataInput.schema'
import { InitiativeUncheckedCreateWithoutMetadataInputObjectSchema } from './InitiativeUncheckedCreateWithoutMetadataInput.schema'
import { InitiativeCreateOrConnectWithoutMetadataInputObjectSchema } from './InitiativeCreateOrConnectWithoutMetadataInput.schema'
import { InitiativeUpsertWithWhereUniqueWithoutMetadataInputObjectSchema } from './InitiativeUpsertWithWhereUniqueWithoutMetadataInput.schema'
import { InitiativeWhereUniqueInputObjectSchema } from './InitiativeWhereUniqueInput.schema'
import { InitiativeUpdateWithWhereUniqueWithoutMetadataInputObjectSchema } from './InitiativeUpdateWithWhereUniqueWithoutMetadataInput.schema'
import { InitiativeUpdateManyWithWhereWithoutMetadataInputObjectSchema } from './InitiativeUpdateManyWithWhereWithoutMetadataInput.schema'
import { InitiativeScalarWhereInputObjectSchema } from './InitiativeScalarWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.InitiativeUpdateManyWithoutMetadataNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => InitiativeCreateWithoutMetadataInputObjectSchema),
          z
            .lazy(() => InitiativeCreateWithoutMetadataInputObjectSchema)
            .array(),
          z.lazy(
            () => InitiativeUncheckedCreateWithoutMetadataInputObjectSchema
          ),
          z
            .lazy(
              () => InitiativeUncheckedCreateWithoutMetadataInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () => InitiativeCreateOrConnectWithoutMetadataInputObjectSchema
          ),
          z
            .lazy(
              () => InitiativeCreateOrConnectWithoutMetadataInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(
            () =>
              InitiativeUpsertWithWhereUniqueWithoutMetadataInputObjectSchema
          ),
          z
            .lazy(
              () =>
                InitiativeUpsertWithWhereUniqueWithoutMetadataInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      set: z
        .union([
          z.lazy(() => InitiativeWhereUniqueInputObjectSchema),
          z.lazy(() => InitiativeWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      disconnect: z
        .union([
          z.lazy(() => InitiativeWhereUniqueInputObjectSchema),
          z.lazy(() => InitiativeWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      delete: z
        .union([
          z.lazy(() => InitiativeWhereUniqueInputObjectSchema),
          z.lazy(() => InitiativeWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => InitiativeWhereUniqueInputObjectSchema),
          z.lazy(() => InitiativeWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
      update: z
        .union([
          z.lazy(
            () =>
              InitiativeUpdateWithWhereUniqueWithoutMetadataInputObjectSchema
          ),
          z
            .lazy(
              () =>
                InitiativeUpdateWithWhereUniqueWithoutMetadataInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () => InitiativeUpdateManyWithWhereWithoutMetadataInputObjectSchema
          ),
          z
            .lazy(
              () =>
                InitiativeUpdateManyWithWhereWithoutMetadataInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      deleteMany: z
        .union([
          z.lazy(() => InitiativeScalarWhereInputObjectSchema),
          z.lazy(() => InitiativeScalarWhereInputObjectSchema).array(),
        ])
        .optional(),
    })
    .strict()

export const InitiativeUpdateManyWithoutMetadataNestedInputObjectSchema = Schema
