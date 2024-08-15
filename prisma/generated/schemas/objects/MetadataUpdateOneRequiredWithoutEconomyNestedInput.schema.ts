import { z } from 'zod'
import { MetadataCreateWithoutEconomyInputObjectSchema } from './MetadataCreateWithoutEconomyInput.schema'
import { MetadataUncheckedCreateWithoutEconomyInputObjectSchema } from './MetadataUncheckedCreateWithoutEconomyInput.schema'
import { MetadataCreateOrConnectWithoutEconomyInputObjectSchema } from './MetadataCreateOrConnectWithoutEconomyInput.schema'
import { MetadataUpsertWithoutEconomyInputObjectSchema } from './MetadataUpsertWithoutEconomyInput.schema'
import { MetadataWhereUniqueInputObjectSchema } from './MetadataWhereUniqueInput.schema'
import { MetadataUpdateWithoutEconomyInputObjectSchema } from './MetadataUpdateWithoutEconomyInput.schema'
import { MetadataUncheckedUpdateWithoutEconomyInputObjectSchema } from './MetadataUncheckedUpdateWithoutEconomyInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataUpdateOneRequiredWithoutEconomyNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => MetadataCreateWithoutEconomyInputObjectSchema),
          z.lazy(() => MetadataUncheckedCreateWithoutEconomyInputObjectSchema),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => MetadataCreateOrConnectWithoutEconomyInputObjectSchema)
        .optional(),
      upsert: z
        .lazy(() => MetadataUpsertWithoutEconomyInputObjectSchema)
        .optional(),
      connect: z.lazy(() => MetadataWhereUniqueInputObjectSchema).optional(),
      update: z
        .union([
          z.lazy(() => MetadataUpdateWithoutEconomyInputObjectSchema),
          z.lazy(() => MetadataUncheckedUpdateWithoutEconomyInputObjectSchema),
        ])
        .optional(),
    })
    .strict()

export const MetadataUpdateOneRequiredWithoutEconomyNestedInputObjectSchema =
  Schema
