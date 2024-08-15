import { z } from 'zod'
import { MetadataWhereUniqueInputObjectSchema } from './MetadataWhereUniqueInput.schema'
import { MetadataCreateWithoutScope2InputObjectSchema } from './MetadataCreateWithoutScope2Input.schema'
import { MetadataUncheckedCreateWithoutScope2InputObjectSchema } from './MetadataUncheckedCreateWithoutScope2Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataCreateOrConnectWithoutScope2Input> = z
  .object({
    where: z.lazy(() => MetadataWhereUniqueInputObjectSchema),
    create: z.union([
      z.lazy(() => MetadataCreateWithoutScope2InputObjectSchema),
      z.lazy(() => MetadataUncheckedCreateWithoutScope2InputObjectSchema),
    ]),
  })
  .strict()

export const MetadataCreateOrConnectWithoutScope2InputObjectSchema = Schema
