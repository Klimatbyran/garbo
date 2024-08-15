import { z } from 'zod'
import { MetadataCreateWithoutScope3InputObjectSchema } from './MetadataCreateWithoutScope3Input.schema'
import { MetadataUncheckedCreateWithoutScope3InputObjectSchema } from './MetadataUncheckedCreateWithoutScope3Input.schema'
import { MetadataCreateOrConnectWithoutScope3InputObjectSchema } from './MetadataCreateOrConnectWithoutScope3Input.schema'
import { MetadataWhereUniqueInputObjectSchema } from './MetadataWhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataCreateNestedOneWithoutScope3Input> = z
  .object({
    create: z
      .union([
        z.lazy(() => MetadataCreateWithoutScope3InputObjectSchema),
        z.lazy(() => MetadataUncheckedCreateWithoutScope3InputObjectSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => MetadataCreateOrConnectWithoutScope3InputObjectSchema)
      .optional(),
    connect: z.lazy(() => MetadataWhereUniqueInputObjectSchema).optional(),
  })
  .strict()

export const MetadataCreateNestedOneWithoutScope3InputObjectSchema = Schema
