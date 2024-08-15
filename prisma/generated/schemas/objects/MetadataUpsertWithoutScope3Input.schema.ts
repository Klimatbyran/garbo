import { z } from 'zod'
import { MetadataUpdateWithoutScope3InputObjectSchema } from './MetadataUpdateWithoutScope3Input.schema'
import { MetadataUncheckedUpdateWithoutScope3InputObjectSchema } from './MetadataUncheckedUpdateWithoutScope3Input.schema'
import { MetadataCreateWithoutScope3InputObjectSchema } from './MetadataCreateWithoutScope3Input.schema'
import { MetadataUncheckedCreateWithoutScope3InputObjectSchema } from './MetadataUncheckedCreateWithoutScope3Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataUpsertWithoutScope3Input> = z
  .object({
    update: z.union([
      z.lazy(() => MetadataUpdateWithoutScope3InputObjectSchema),
      z.lazy(() => MetadataUncheckedUpdateWithoutScope3InputObjectSchema),
    ]),
    create: z.union([
      z.lazy(() => MetadataCreateWithoutScope3InputObjectSchema),
      z.lazy(() => MetadataUncheckedCreateWithoutScope3InputObjectSchema),
    ]),
  })
  .strict()

export const MetadataUpsertWithoutScope3InputObjectSchema = Schema
