import { z } from 'zod'
import { MetadataCreateWithoutScope3InputObjectSchema } from './MetadataCreateWithoutScope3Input.schema'
import { MetadataUncheckedCreateWithoutScope3InputObjectSchema } from './MetadataUncheckedCreateWithoutScope3Input.schema'
import { MetadataCreateOrConnectWithoutScope3InputObjectSchema } from './MetadataCreateOrConnectWithoutScope3Input.schema'
import { MetadataUpsertWithoutScope3InputObjectSchema } from './MetadataUpsertWithoutScope3Input.schema'
import { MetadataWhereUniqueInputObjectSchema } from './MetadataWhereUniqueInput.schema'
import { MetadataUpdateWithoutScope3InputObjectSchema } from './MetadataUpdateWithoutScope3Input.schema'
import { MetadataUncheckedUpdateWithoutScope3InputObjectSchema } from './MetadataUncheckedUpdateWithoutScope3Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataUpdateOneRequiredWithoutScope3NestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => MetadataCreateWithoutScope3InputObjectSchema),
          z.lazy(() => MetadataUncheckedCreateWithoutScope3InputObjectSchema),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => MetadataCreateOrConnectWithoutScope3InputObjectSchema)
        .optional(),
      upsert: z
        .lazy(() => MetadataUpsertWithoutScope3InputObjectSchema)
        .optional(),
      connect: z.lazy(() => MetadataWhereUniqueInputObjectSchema).optional(),
      update: z
        .union([
          z.lazy(() => MetadataUpdateWithoutScope3InputObjectSchema),
          z.lazy(() => MetadataUncheckedUpdateWithoutScope3InputObjectSchema),
        ])
        .optional(),
    })
    .strict()

export const MetadataUpdateOneRequiredWithoutScope3NestedInputObjectSchema =
  Schema
