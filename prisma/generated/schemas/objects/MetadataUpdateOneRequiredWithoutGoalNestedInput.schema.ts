import { z } from 'zod'
import { MetadataCreateWithoutGoalInputObjectSchema } from './MetadataCreateWithoutGoalInput.schema'
import { MetadataUncheckedCreateWithoutGoalInputObjectSchema } from './MetadataUncheckedCreateWithoutGoalInput.schema'
import { MetadataCreateOrConnectWithoutGoalInputObjectSchema } from './MetadataCreateOrConnectWithoutGoalInput.schema'
import { MetadataUpsertWithoutGoalInputObjectSchema } from './MetadataUpsertWithoutGoalInput.schema'
import { MetadataWhereUniqueInputObjectSchema } from './MetadataWhereUniqueInput.schema'
import { MetadataUpdateWithoutGoalInputObjectSchema } from './MetadataUpdateWithoutGoalInput.schema'
import { MetadataUncheckedUpdateWithoutGoalInputObjectSchema } from './MetadataUncheckedUpdateWithoutGoalInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataUpdateOneRequiredWithoutGoalNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => MetadataCreateWithoutGoalInputObjectSchema),
          z.lazy(() => MetadataUncheckedCreateWithoutGoalInputObjectSchema),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => MetadataCreateOrConnectWithoutGoalInputObjectSchema)
        .optional(),
      upsert: z
        .lazy(() => MetadataUpsertWithoutGoalInputObjectSchema)
        .optional(),
      connect: z.lazy(() => MetadataWhereUniqueInputObjectSchema).optional(),
      update: z
        .union([
          z.lazy(() => MetadataUpdateWithoutGoalInputObjectSchema),
          z.lazy(() => MetadataUncheckedUpdateWithoutGoalInputObjectSchema),
        ])
        .optional(),
    })
    .strict()

export const MetadataUpdateOneRequiredWithoutGoalNestedInputObjectSchema =
  Schema
