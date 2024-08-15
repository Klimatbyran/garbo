import { z } from 'zod'
import { GoalWhereUniqueInputObjectSchema } from './GoalWhereUniqueInput.schema'
import { GoalCreateWithoutMetadataInputObjectSchema } from './GoalCreateWithoutMetadataInput.schema'
import { GoalUncheckedCreateWithoutMetadataInputObjectSchema } from './GoalUncheckedCreateWithoutMetadataInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.GoalCreateOrConnectWithoutMetadataInput> = z
  .object({
    where: z.lazy(() => GoalWhereUniqueInputObjectSchema),
    create: z.union([
      z.lazy(() => GoalCreateWithoutMetadataInputObjectSchema),
      z.lazy(() => GoalUncheckedCreateWithoutMetadataInputObjectSchema),
    ]),
  })
  .strict()

export const GoalCreateOrConnectWithoutMetadataInputObjectSchema = Schema
