import { z } from 'zod'
import { MetadataUpdateWithoutScope2InputObjectSchema } from './MetadataUpdateWithoutScope2Input.schema'
import { MetadataUncheckedUpdateWithoutScope2InputObjectSchema } from './MetadataUncheckedUpdateWithoutScope2Input.schema'
import { MetadataCreateWithoutScope2InputObjectSchema } from './MetadataCreateWithoutScope2Input.schema'
import { MetadataUncheckedCreateWithoutScope2InputObjectSchema } from './MetadataUncheckedCreateWithoutScope2Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataUpsertWithoutScope2Input> = z
  .object({
    update: z.union([
      z.lazy(() => MetadataUpdateWithoutScope2InputObjectSchema),
      z.lazy(() => MetadataUncheckedUpdateWithoutScope2InputObjectSchema),
    ]),
    create: z.union([
      z.lazy(() => MetadataCreateWithoutScope2InputObjectSchema),
      z.lazy(() => MetadataUncheckedCreateWithoutScope2InputObjectSchema),
    ]),
  })
  .strict()

export const MetadataUpsertWithoutScope2InputObjectSchema = Schema
