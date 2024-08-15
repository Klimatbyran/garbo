import { z } from 'zod'
import { MetadataUpdateWithoutGoalInputObjectSchema } from './MetadataUpdateWithoutGoalInput.schema'
import { MetadataUncheckedUpdateWithoutGoalInputObjectSchema } from './MetadataUncheckedUpdateWithoutGoalInput.schema'
import { MetadataCreateWithoutGoalInputObjectSchema } from './MetadataCreateWithoutGoalInput.schema'
import { MetadataUncheckedCreateWithoutGoalInputObjectSchema } from './MetadataUncheckedCreateWithoutGoalInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataUpsertWithoutGoalInput> = z
  .object({
    update: z.union([
      z.lazy(() => MetadataUpdateWithoutGoalInputObjectSchema),
      z.lazy(() => MetadataUncheckedUpdateWithoutGoalInputObjectSchema),
    ]),
    create: z.union([
      z.lazy(() => MetadataCreateWithoutGoalInputObjectSchema),
      z.lazy(() => MetadataUncheckedCreateWithoutGoalInputObjectSchema),
    ]),
  })
  .strict()

export const MetadataUpsertWithoutGoalInputObjectSchema = Schema
