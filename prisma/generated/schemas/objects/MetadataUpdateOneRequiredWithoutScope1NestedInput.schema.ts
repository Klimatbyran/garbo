import { z } from 'zod'
import { MetadataCreateWithoutScope1InputObjectSchema } from './MetadataCreateWithoutScope1Input.schema'
import { MetadataUncheckedCreateWithoutScope1InputObjectSchema } from './MetadataUncheckedCreateWithoutScope1Input.schema'
import { MetadataCreateOrConnectWithoutScope1InputObjectSchema } from './MetadataCreateOrConnectWithoutScope1Input.schema'
import { MetadataUpsertWithoutScope1InputObjectSchema } from './MetadataUpsertWithoutScope1Input.schema'
import { MetadataWhereUniqueInputObjectSchema } from './MetadataWhereUniqueInput.schema'
import { MetadataUpdateWithoutScope1InputObjectSchema } from './MetadataUpdateWithoutScope1Input.schema'
import { MetadataUncheckedUpdateWithoutScope1InputObjectSchema } from './MetadataUncheckedUpdateWithoutScope1Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataUpdateOneRequiredWithoutScope1NestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => MetadataCreateWithoutScope1InputObjectSchema),
          z.lazy(() => MetadataUncheckedCreateWithoutScope1InputObjectSchema),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => MetadataCreateOrConnectWithoutScope1InputObjectSchema)
        .optional(),
      upsert: z
        .lazy(() => MetadataUpsertWithoutScope1InputObjectSchema)
        .optional(),
      connect: z.lazy(() => MetadataWhereUniqueInputObjectSchema).optional(),
      update: z
        .union([
          z.lazy(() => MetadataUpdateWithoutScope1InputObjectSchema),
          z.lazy(() => MetadataUncheckedUpdateWithoutScope1InputObjectSchema),
        ])
        .optional(),
    })
    .strict()

export const MetadataUpdateOneRequiredWithoutScope1NestedInputObjectSchema =
  Schema
