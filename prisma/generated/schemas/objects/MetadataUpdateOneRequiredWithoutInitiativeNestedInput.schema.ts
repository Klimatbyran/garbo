import { z } from 'zod'
import { MetadataCreateWithoutInitiativeInputObjectSchema } from './MetadataCreateWithoutInitiativeInput.schema'
import { MetadataUncheckedCreateWithoutInitiativeInputObjectSchema } from './MetadataUncheckedCreateWithoutInitiativeInput.schema'
import { MetadataCreateOrConnectWithoutInitiativeInputObjectSchema } from './MetadataCreateOrConnectWithoutInitiativeInput.schema'
import { MetadataUpsertWithoutInitiativeInputObjectSchema } from './MetadataUpsertWithoutInitiativeInput.schema'
import { MetadataWhereUniqueInputObjectSchema } from './MetadataWhereUniqueInput.schema'
import { MetadataUpdateWithoutInitiativeInputObjectSchema } from './MetadataUpdateWithoutInitiativeInput.schema'
import { MetadataUncheckedUpdateWithoutInitiativeInputObjectSchema } from './MetadataUncheckedUpdateWithoutInitiativeInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataUpdateOneRequiredWithoutInitiativeNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => MetadataCreateWithoutInitiativeInputObjectSchema),
          z.lazy(
            () => MetadataUncheckedCreateWithoutInitiativeInputObjectSchema
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => MetadataCreateOrConnectWithoutInitiativeInputObjectSchema)
        .optional(),
      upsert: z
        .lazy(() => MetadataUpsertWithoutInitiativeInputObjectSchema)
        .optional(),
      connect: z.lazy(() => MetadataWhereUniqueInputObjectSchema).optional(),
      update: z
        .union([
          z.lazy(() => MetadataUpdateWithoutInitiativeInputObjectSchema),
          z.lazy(
            () => MetadataUncheckedUpdateWithoutInitiativeInputObjectSchema
          ),
        ])
        .optional(),
    })
    .strict()

export const MetadataUpdateOneRequiredWithoutInitiativeNestedInputObjectSchema =
  Schema
