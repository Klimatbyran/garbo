import { z } from 'zod'
import { EconomyWhereUniqueInputObjectSchema } from './EconomyWhereUniqueInput.schema'
import { EconomyUpdateWithoutMetadataInputObjectSchema } from './EconomyUpdateWithoutMetadataInput.schema'
import { EconomyUncheckedUpdateWithoutMetadataInputObjectSchema } from './EconomyUncheckedUpdateWithoutMetadataInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EconomyUpdateWithWhereUniqueWithoutMetadataInput> =
  z
    .object({
      where: z.lazy(() => EconomyWhereUniqueInputObjectSchema),
      data: z.union([
        z.lazy(() => EconomyUpdateWithoutMetadataInputObjectSchema),
        z.lazy(() => EconomyUncheckedUpdateWithoutMetadataInputObjectSchema),
      ]),
    })
    .strict()

export const EconomyUpdateWithWhereUniqueWithoutMetadataInputObjectSchema =
  Schema
