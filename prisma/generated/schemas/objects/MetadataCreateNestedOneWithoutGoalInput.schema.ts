import { z } from 'zod'
import { MetadataCreateWithoutGoalInputObjectSchema } from './MetadataCreateWithoutGoalInput.schema'
import { MetadataUncheckedCreateWithoutGoalInputObjectSchema } from './MetadataUncheckedCreateWithoutGoalInput.schema'
import { MetadataCreateOrConnectWithoutGoalInputObjectSchema } from './MetadataCreateOrConnectWithoutGoalInput.schema'
import { MetadataWhereUniqueInputObjectSchema } from './MetadataWhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataCreateNestedOneWithoutGoalInput> = z
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
    connect: z.lazy(() => MetadataWhereUniqueInputObjectSchema).optional(),
  })
  .strict()

export const MetadataCreateNestedOneWithoutGoalInputObjectSchema = Schema
