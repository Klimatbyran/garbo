import { z } from 'zod'
import { MetadataWhereUniqueInputObjectSchema } from './MetadataWhereUniqueInput.schema'
import { MetadataCreateWithoutScope3CategoryInputObjectSchema } from './MetadataCreateWithoutScope3CategoryInput.schema'
import { MetadataUncheckedCreateWithoutScope3CategoryInputObjectSchema } from './MetadataUncheckedCreateWithoutScope3CategoryInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataCreateOrConnectWithoutScope3CategoryInput> =
  z
    .object({
      where: z.lazy(() => MetadataWhereUniqueInputObjectSchema),
      create: z.union([
        z.lazy(() => MetadataCreateWithoutScope3CategoryInputObjectSchema),
        z.lazy(
          () => MetadataUncheckedCreateWithoutScope3CategoryInputObjectSchema
        ),
      ]),
    })
    .strict()

export const MetadataCreateOrConnectWithoutScope3CategoryInputObjectSchema =
  Schema
