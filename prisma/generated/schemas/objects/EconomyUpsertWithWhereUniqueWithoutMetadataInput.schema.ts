import { z } from 'zod'
import { EconomyWhereUniqueInputObjectSchema } from './EconomyWhereUniqueInput.schema'
import { EconomyUpdateWithoutMetadataInputObjectSchema } from './EconomyUpdateWithoutMetadataInput.schema'
import { EconomyUncheckedUpdateWithoutMetadataInputObjectSchema } from './EconomyUncheckedUpdateWithoutMetadataInput.schema'
import { EconomyCreateWithoutMetadataInputObjectSchema } from './EconomyCreateWithoutMetadataInput.schema'
import { EconomyUncheckedCreateWithoutMetadataInputObjectSchema } from './EconomyUncheckedCreateWithoutMetadataInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EconomyUpsertWithWhereUniqueWithoutMetadataInput> =
  z
    .object({
      where: z.lazy(() => EconomyWhereUniqueInputObjectSchema),
      update: z.union([
        z.lazy(() => EconomyUpdateWithoutMetadataInputObjectSchema),
        z.lazy(() => EconomyUncheckedUpdateWithoutMetadataInputObjectSchema),
      ]),
      create: z.union([
        z.lazy(() => EconomyCreateWithoutMetadataInputObjectSchema),
        z.lazy(() => EconomyUncheckedCreateWithoutMetadataInputObjectSchema),
      ]),
    })
    .strict()

export const EconomyUpsertWithWhereUniqueWithoutMetadataInputObjectSchema =
  Schema
