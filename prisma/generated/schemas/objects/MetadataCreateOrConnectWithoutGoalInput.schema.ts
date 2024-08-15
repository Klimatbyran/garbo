import { z } from 'zod'
import { MetadataWhereUniqueInputObjectSchema } from './MetadataWhereUniqueInput.schema'
import { MetadataCreateWithoutGoalInputObjectSchema } from './MetadataCreateWithoutGoalInput.schema'
import { MetadataUncheckedCreateWithoutGoalInputObjectSchema } from './MetadataUncheckedCreateWithoutGoalInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataCreateOrConnectWithoutGoalInput> = z
  .object({
    where: z.lazy(() => MetadataWhereUniqueInputObjectSchema),
    create: z.union([
      z.lazy(() => MetadataCreateWithoutGoalInputObjectSchema),
      z.lazy(() => MetadataUncheckedCreateWithoutGoalInputObjectSchema),
    ]),
  })
  .strict()

export const MetadataCreateOrConnectWithoutGoalInputObjectSchema = Schema
