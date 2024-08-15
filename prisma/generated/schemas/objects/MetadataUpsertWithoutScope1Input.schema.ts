import { z } from 'zod'
import { MetadataUpdateWithoutScope1InputObjectSchema } from './MetadataUpdateWithoutScope1Input.schema'
import { MetadataUncheckedUpdateWithoutScope1InputObjectSchema } from './MetadataUncheckedUpdateWithoutScope1Input.schema'
import { MetadataCreateWithoutScope1InputObjectSchema } from './MetadataCreateWithoutScope1Input.schema'
import { MetadataUncheckedCreateWithoutScope1InputObjectSchema } from './MetadataUncheckedCreateWithoutScope1Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataUpsertWithoutScope1Input> = z
  .object({
    update: z.union([
      z.lazy(() => MetadataUpdateWithoutScope1InputObjectSchema),
      z.lazy(() => MetadataUncheckedUpdateWithoutScope1InputObjectSchema),
    ]),
    create: z.union([
      z.lazy(() => MetadataCreateWithoutScope1InputObjectSchema),
      z.lazy(() => MetadataUncheckedCreateWithoutScope1InputObjectSchema),
    ]),
  })
  .strict()

export const MetadataUpsertWithoutScope1InputObjectSchema = Schema
