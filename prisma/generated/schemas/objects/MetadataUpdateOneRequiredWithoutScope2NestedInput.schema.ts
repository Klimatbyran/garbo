import { z } from 'zod'
import { MetadataCreateWithoutScope2InputObjectSchema } from './MetadataCreateWithoutScope2Input.schema'
import { MetadataUncheckedCreateWithoutScope2InputObjectSchema } from './MetadataUncheckedCreateWithoutScope2Input.schema'
import { MetadataCreateOrConnectWithoutScope2InputObjectSchema } from './MetadataCreateOrConnectWithoutScope2Input.schema'
import { MetadataUpsertWithoutScope2InputObjectSchema } from './MetadataUpsertWithoutScope2Input.schema'
import { MetadataWhereUniqueInputObjectSchema } from './MetadataWhereUniqueInput.schema'
import { MetadataUpdateWithoutScope2InputObjectSchema } from './MetadataUpdateWithoutScope2Input.schema'
import { MetadataUncheckedUpdateWithoutScope2InputObjectSchema } from './MetadataUncheckedUpdateWithoutScope2Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataUpdateOneRequiredWithoutScope2NestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => MetadataCreateWithoutScope2InputObjectSchema),
          z.lazy(() => MetadataUncheckedCreateWithoutScope2InputObjectSchema),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => MetadataCreateOrConnectWithoutScope2InputObjectSchema)
        .optional(),
      upsert: z
        .lazy(() => MetadataUpsertWithoutScope2InputObjectSchema)
        .optional(),
      connect: z.lazy(() => MetadataWhereUniqueInputObjectSchema).optional(),
      update: z
        .union([
          z.lazy(() => MetadataUpdateWithoutScope2InputObjectSchema),
          z.lazy(() => MetadataUncheckedUpdateWithoutScope2InputObjectSchema),
        ])
        .optional(),
    })
    .strict()

export const MetadataUpdateOneRequiredWithoutScope2NestedInputObjectSchema =
  Schema
