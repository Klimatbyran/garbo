import { z } from 'zod'
import { GoalWhereUniqueInputObjectSchema } from './GoalWhereUniqueInput.schema'
import { GoalUpdateWithoutMetadataInputObjectSchema } from './GoalUpdateWithoutMetadataInput.schema'
import { GoalUncheckedUpdateWithoutMetadataInputObjectSchema } from './GoalUncheckedUpdateWithoutMetadataInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.GoalUpdateWithWhereUniqueWithoutMetadataInput> =
  z
    .object({
      where: z.lazy(() => GoalWhereUniqueInputObjectSchema),
      data: z.union([
        z.lazy(() => GoalUpdateWithoutMetadataInputObjectSchema),
        z.lazy(() => GoalUncheckedUpdateWithoutMetadataInputObjectSchema),
      ]),
    })
    .strict()

export const GoalUpdateWithWhereUniqueWithoutMetadataInputObjectSchema = Schema
