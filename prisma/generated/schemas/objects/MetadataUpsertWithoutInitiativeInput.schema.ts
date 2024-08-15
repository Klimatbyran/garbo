import { z } from 'zod'
import { MetadataUpdateWithoutInitiativeInputObjectSchema } from './MetadataUpdateWithoutInitiativeInput.schema'
import { MetadataUncheckedUpdateWithoutInitiativeInputObjectSchema } from './MetadataUncheckedUpdateWithoutInitiativeInput.schema'
import { MetadataCreateWithoutInitiativeInputObjectSchema } from './MetadataCreateWithoutInitiativeInput.schema'
import { MetadataUncheckedCreateWithoutInitiativeInputObjectSchema } from './MetadataUncheckedCreateWithoutInitiativeInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataUpsertWithoutInitiativeInput> = z
  .object({
    update: z.union([
      z.lazy(() => MetadataUpdateWithoutInitiativeInputObjectSchema),
      z.lazy(() => MetadataUncheckedUpdateWithoutInitiativeInputObjectSchema),
    ]),
    create: z.union([
      z.lazy(() => MetadataCreateWithoutInitiativeInputObjectSchema),
      z.lazy(() => MetadataUncheckedCreateWithoutInitiativeInputObjectSchema),
    ]),
  })
  .strict()

export const MetadataUpsertWithoutInitiativeInputObjectSchema = Schema
