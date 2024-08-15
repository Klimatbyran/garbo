import { z } from 'zod'
import { MetadataWhereUniqueInputObjectSchema } from './MetadataWhereUniqueInput.schema'
import { MetadataCreateWithoutInitiativeInputObjectSchema } from './MetadataCreateWithoutInitiativeInput.schema'
import { MetadataUncheckedCreateWithoutInitiativeInputObjectSchema } from './MetadataUncheckedCreateWithoutInitiativeInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataCreateOrConnectWithoutInitiativeInput> =
  z
    .object({
      where: z.lazy(() => MetadataWhereUniqueInputObjectSchema),
      create: z.union([
        z.lazy(() => MetadataCreateWithoutInitiativeInputObjectSchema),
        z.lazy(() => MetadataUncheckedCreateWithoutInitiativeInputObjectSchema),
      ]),
    })
    .strict()

export const MetadataCreateOrConnectWithoutInitiativeInputObjectSchema = Schema
