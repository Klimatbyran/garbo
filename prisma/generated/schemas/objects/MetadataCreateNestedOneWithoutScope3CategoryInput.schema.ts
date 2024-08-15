import { z } from 'zod'
import { MetadataCreateWithoutScope3CategoryInputObjectSchema } from './MetadataCreateWithoutScope3CategoryInput.schema'
import { MetadataUncheckedCreateWithoutScope3CategoryInputObjectSchema } from './MetadataUncheckedCreateWithoutScope3CategoryInput.schema'
import { MetadataCreateOrConnectWithoutScope3CategoryInputObjectSchema } from './MetadataCreateOrConnectWithoutScope3CategoryInput.schema'
import { MetadataWhereUniqueInputObjectSchema } from './MetadataWhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataCreateNestedOneWithoutScope3CategoryInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => MetadataCreateWithoutScope3CategoryInputObjectSchema),
          z.lazy(
            () => MetadataUncheckedCreateWithoutScope3CategoryInputObjectSchema
          ),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(
          () => MetadataCreateOrConnectWithoutScope3CategoryInputObjectSchema
        )
        .optional(),
      connect: z.lazy(() => MetadataWhereUniqueInputObjectSchema).optional(),
    })
    .strict()

export const MetadataCreateNestedOneWithoutScope3CategoryInputObjectSchema =
  Schema
