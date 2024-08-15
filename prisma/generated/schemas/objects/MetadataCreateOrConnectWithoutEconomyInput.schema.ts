import { z } from 'zod'
import { MetadataWhereUniqueInputObjectSchema } from './MetadataWhereUniqueInput.schema'
import { MetadataCreateWithoutEconomyInputObjectSchema } from './MetadataCreateWithoutEconomyInput.schema'
import { MetadataUncheckedCreateWithoutEconomyInputObjectSchema } from './MetadataUncheckedCreateWithoutEconomyInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataCreateOrConnectWithoutEconomyInput> = z
  .object({
    where: z.lazy(() => MetadataWhereUniqueInputObjectSchema),
    create: z.union([
      z.lazy(() => MetadataCreateWithoutEconomyInputObjectSchema),
      z.lazy(() => MetadataUncheckedCreateWithoutEconomyInputObjectSchema),
    ]),
  })
  .strict()

export const MetadataCreateOrConnectWithoutEconomyInputObjectSchema = Schema
