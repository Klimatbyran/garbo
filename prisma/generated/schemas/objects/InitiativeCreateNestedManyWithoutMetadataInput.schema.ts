import { z } from 'zod'
import { InitiativeCreateWithoutMetadataInputObjectSchema } from './InitiativeCreateWithoutMetadataInput.schema'
import { InitiativeUncheckedCreateWithoutMetadataInputObjectSchema } from './InitiativeUncheckedCreateWithoutMetadataInput.schema'
import { InitiativeCreateOrConnectWithoutMetadataInputObjectSchema } from './InitiativeCreateOrConnectWithoutMetadataInput.schema'
import { InitiativeWhereUniqueInputObjectSchema } from './InitiativeWhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.InitiativeCreateNestedManyWithoutMetadataInput> =
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
      connect: z
        .union([
          z.lazy(() => InitiativeWhereUniqueInputObjectSchema),
          z.lazy(() => InitiativeWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
    })
    .strict()

export const InitiativeCreateNestedManyWithoutMetadataInputObjectSchema = Schema
