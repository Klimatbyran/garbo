import { z } from 'zod'
import { MetadataUpdateWithoutEconomyInputObjectSchema } from './MetadataUpdateWithoutEconomyInput.schema'
import { MetadataUncheckedUpdateWithoutEconomyInputObjectSchema } from './MetadataUncheckedUpdateWithoutEconomyInput.schema'
import { MetadataCreateWithoutEconomyInputObjectSchema } from './MetadataCreateWithoutEconomyInput.schema'
import { MetadataUncheckedCreateWithoutEconomyInputObjectSchema } from './MetadataUncheckedCreateWithoutEconomyInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataUpsertWithoutEconomyInput> = z
  .object({
    update: z.union([
      z.lazy(() => MetadataUpdateWithoutEconomyInputObjectSchema),
      z.lazy(() => MetadataUncheckedUpdateWithoutEconomyInputObjectSchema),
    ]),
    create: z.union([
      z.lazy(() => MetadataCreateWithoutEconomyInputObjectSchema),
      z.lazy(() => MetadataUncheckedCreateWithoutEconomyInputObjectSchema),
    ]),
  })
  .strict()

export const MetadataUpsertWithoutEconomyInputObjectSchema = Schema
