import { z } from 'zod'
import { MetadataUpdateWithoutScope3CategoryInputObjectSchema } from './MetadataUpdateWithoutScope3CategoryInput.schema'
import { MetadataUncheckedUpdateWithoutScope3CategoryInputObjectSchema } from './MetadataUncheckedUpdateWithoutScope3CategoryInput.schema'
import { MetadataCreateWithoutScope3CategoryInputObjectSchema } from './MetadataCreateWithoutScope3CategoryInput.schema'
import { MetadataUncheckedCreateWithoutScope3CategoryInputObjectSchema } from './MetadataUncheckedCreateWithoutScope3CategoryInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataUpsertWithoutScope3CategoryInput> = z
  .object({
    update: z.union([
      z.lazy(() => MetadataUpdateWithoutScope3CategoryInputObjectSchema),
      z.lazy(
        () => MetadataUncheckedUpdateWithoutScope3CategoryInputObjectSchema
      ),
    ]),
    create: z.union([
      z.lazy(() => MetadataCreateWithoutScope3CategoryInputObjectSchema),
      z.lazy(
        () => MetadataUncheckedCreateWithoutScope3CategoryInputObjectSchema
      ),
    ]),
  })
  .strict()

export const MetadataUpsertWithoutScope3CategoryInputObjectSchema = Schema
