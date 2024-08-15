import { z } from 'zod'
import { EconomyWhereUniqueInputObjectSchema } from './EconomyWhereUniqueInput.schema'
import { EconomyCreateWithoutMetadataInputObjectSchema } from './EconomyCreateWithoutMetadataInput.schema'
import { EconomyUncheckedCreateWithoutMetadataInputObjectSchema } from './EconomyUncheckedCreateWithoutMetadataInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EconomyCreateOrConnectWithoutMetadataInput> = z
  .object({
    where: z.lazy(() => EconomyWhereUniqueInputObjectSchema),
    create: z.union([
      z.lazy(() => EconomyCreateWithoutMetadataInputObjectSchema),
      z.lazy(() => EconomyUncheckedCreateWithoutMetadataInputObjectSchema),
    ]),
  })
  .strict()

export const EconomyCreateOrConnectWithoutMetadataInputObjectSchema = Schema
