import { z } from 'zod'
import { InitiativeCreateWithoutCompanyInputObjectSchema } from './InitiativeCreateWithoutCompanyInput.schema'
import { InitiativeUncheckedCreateWithoutCompanyInputObjectSchema } from './InitiativeUncheckedCreateWithoutCompanyInput.schema'
import { InitiativeCreateOrConnectWithoutCompanyInputObjectSchema } from './InitiativeCreateOrConnectWithoutCompanyInput.schema'
import { InitiativeUpsertWithWhereUniqueWithoutCompanyInputObjectSchema } from './InitiativeUpsertWithWhereUniqueWithoutCompanyInput.schema'
import { InitiativeWhereUniqueInputObjectSchema } from './InitiativeWhereUniqueInput.schema'
import { InitiativeUpdateWithWhereUniqueWithoutCompanyInputObjectSchema } from './InitiativeUpdateWithWhereUniqueWithoutCompanyInput.schema'
import { InitiativeUpdateManyWithWhereWithoutCompanyInputObjectSchema } from './InitiativeUpdateManyWithWhereWithoutCompanyInput.schema'
import { InitiativeScalarWhereInputObjectSchema } from './InitiativeScalarWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.InitiativeUncheckedUpdateManyWithoutCompanyNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => InitiativeCreateWithoutCompanyInputObjectSchema),
          z.lazy(() => InitiativeCreateWithoutCompanyInputObjectSchema).array(),
          z.lazy(
            () => InitiativeUncheckedCreateWithoutCompanyInputObjectSchema
          ),
          z
            .lazy(
              () => InitiativeUncheckedCreateWithoutCompanyInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () => InitiativeCreateOrConnectWithoutCompanyInputObjectSchema
          ),
          z
            .lazy(
              () => InitiativeCreateOrConnectWithoutCompanyInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      upsert: z
        .union([
          z.lazy(
            () => InitiativeUpsertWithWhereUniqueWithoutCompanyInputObjectSchema
          ),
          z
            .lazy(
              () =>
                InitiativeUpsertWithWhereUniqueWithoutCompanyInputObjectSchema
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
            () => InitiativeUpdateWithWhereUniqueWithoutCompanyInputObjectSchema
          ),
          z
            .lazy(
              () =>
                InitiativeUpdateWithWhereUniqueWithoutCompanyInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      updateMany: z
        .union([
          z.lazy(
            () => InitiativeUpdateManyWithWhereWithoutCompanyInputObjectSchema
          ),
          z
            .lazy(
              () => InitiativeUpdateManyWithWhereWithoutCompanyInputObjectSchema
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

export const InitiativeUncheckedUpdateManyWithoutCompanyNestedInputObjectSchema =
  Schema
