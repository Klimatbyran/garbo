import { z } from 'zod'
import { MetadataWhereUniqueInputObjectSchema } from './MetadataWhereUniqueInput.schema'
import { MetadataCreateWithoutScope3InputObjectSchema } from './MetadataCreateWithoutScope3Input.schema'
import { MetadataUncheckedCreateWithoutScope3InputObjectSchema } from './MetadataUncheckedCreateWithoutScope3Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataCreateOrConnectWithoutScope3Input> = z
  .object({
    where: z.lazy(() => MetadataWhereUniqueInputObjectSchema),
    create: z.union([
      z.lazy(() => MetadataCreateWithoutScope3InputObjectSchema),
      z.lazy(() => MetadataUncheckedCreateWithoutScope3InputObjectSchema),
    ]),
  })
  .strict()

export const MetadataCreateOrConnectWithoutScope3InputObjectSchema = Schema
