import { z } from 'zod'
import { MetadataCreateWithoutEconomyInputObjectSchema } from './MetadataCreateWithoutEconomyInput.schema'
import { MetadataUncheckedCreateWithoutEconomyInputObjectSchema } from './MetadataUncheckedCreateWithoutEconomyInput.schema'
import { MetadataCreateOrConnectWithoutEconomyInputObjectSchema } from './MetadataCreateOrConnectWithoutEconomyInput.schema'
import { MetadataWhereUniqueInputObjectSchema } from './MetadataWhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataCreateNestedOneWithoutEconomyInput> = z
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
    connect: z.lazy(() => MetadataWhereUniqueInputObjectSchema).optional(),
  })
  .strict()

export const MetadataCreateNestedOneWithoutEconomyInputObjectSchema = Schema
