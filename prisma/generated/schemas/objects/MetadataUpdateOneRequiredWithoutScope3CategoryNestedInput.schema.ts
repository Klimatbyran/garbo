import { z } from 'zod'
import { MetadataCreateWithoutScope3CategoryInputObjectSchema } from './MetadataCreateWithoutScope3CategoryInput.schema'
import { MetadataUncheckedCreateWithoutScope3CategoryInputObjectSchema } from './MetadataUncheckedCreateWithoutScope3CategoryInput.schema'
import { MetadataCreateOrConnectWithoutScope3CategoryInputObjectSchema } from './MetadataCreateOrConnectWithoutScope3CategoryInput.schema'
import { MetadataUpsertWithoutScope3CategoryInputObjectSchema } from './MetadataUpsertWithoutScope3CategoryInput.schema'
import { MetadataWhereUniqueInputObjectSchema } from './MetadataWhereUniqueInput.schema'
import { MetadataUpdateWithoutScope3CategoryInputObjectSchema } from './MetadataUpdateWithoutScope3CategoryInput.schema'
import { MetadataUncheckedUpdateWithoutScope3CategoryInputObjectSchema } from './MetadataUncheckedUpdateWithoutScope3CategoryInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataUpdateOneRequiredWithoutScope3CategoryNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => MetadataCreateWithoutScope3CategoryInputObjectSchema),
          z.lazy(
            () => MetadataUncheckedCreateWithoutScope3CategoryInputObjectSchema
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(
          () => MetadataCreateOrConnectWithoutScope3CategoryInputObjectSchema
        )
        .optional(),
      upsert: z
        .lazy(() => MetadataUpsertWithoutScope3CategoryInputObjectSchema)
        .optional(),
      connect: z.lazy(() => MetadataWhereUniqueInputObjectSchema).optional(),
      update: z
        .union([
          z.lazy(() => MetadataUpdateWithoutScope3CategoryInputObjectSchema),
          z.lazy(
            () => MetadataUncheckedUpdateWithoutScope3CategoryInputObjectSchema
          ),
        ])
        .optional(),
    })
    .strict()

export const MetadataUpdateOneRequiredWithoutScope3CategoryNestedInputObjectSchema =
  Schema
