import { z } from 'zod'
import { MetadataWhereUniqueInputObjectSchema } from './MetadataWhereUniqueInput.schema'
import { MetadataCreateWithoutScope1InputObjectSchema } from './MetadataCreateWithoutScope1Input.schema'
import { MetadataUncheckedCreateWithoutScope1InputObjectSchema } from './MetadataUncheckedCreateWithoutScope1Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataCreateOrConnectWithoutScope1Input> = z
  .object({
    where: z.lazy(() => MetadataWhereUniqueInputObjectSchema),
    create: z.union([
      z.lazy(() => MetadataCreateWithoutScope1InputObjectSchema),
      z.lazy(() => MetadataUncheckedCreateWithoutScope1InputObjectSchema),
    ]),
  })
  .strict()

export const MetadataCreateOrConnectWithoutScope1InputObjectSchema = Schema
