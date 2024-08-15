import { z } from 'zod'
import { GoalWhereUniqueInputObjectSchema } from './GoalWhereUniqueInput.schema'
import { GoalUpdateWithoutMetadataInputObjectSchema } from './GoalUpdateWithoutMetadataInput.schema'
import { GoalUncheckedUpdateWithoutMetadataInputObjectSchema } from './GoalUncheckedUpdateWithoutMetadataInput.schema'
import { GoalCreateWithoutMetadataInputObjectSchema } from './GoalCreateWithoutMetadataInput.schema'
import { GoalUncheckedCreateWithoutMetadataInputObjectSchema } from './GoalUncheckedCreateWithoutMetadataInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.GoalUpsertWithWhereUniqueWithoutMetadataInput> =
  z
    .object({
      where: z.lazy(() => GoalWhereUniqueInputObjectSchema),
      update: z.union([
        z.lazy(() => GoalUpdateWithoutMetadataInputObjectSchema),
        z.lazy(() => GoalUncheckedUpdateWithoutMetadataInputObjectSchema),
      ]),
      create: z.union([
        z.lazy(() => GoalCreateWithoutMetadataInputObjectSchema),
        z.lazy(() => GoalUncheckedCreateWithoutMetadataInputObjectSchema),
      ]),
    })
    .strict()

export const GoalUpsertWithWhereUniqueWithoutMetadataInputObjectSchema = Schema
