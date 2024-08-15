import { z } from 'zod'
import { MetadataCreateWithoutScope1InputObjectSchema } from './MetadataCreateWithoutScope1Input.schema'
import { MetadataUncheckedCreateWithoutScope1InputObjectSchema } from './MetadataUncheckedCreateWithoutScope1Input.schema'
import { MetadataCreateOrConnectWithoutScope1InputObjectSchema } from './MetadataCreateOrConnectWithoutScope1Input.schema'
import { MetadataWhereUniqueInputObjectSchema } from './MetadataWhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataCreateNestedOneWithoutScope1Input> = z
  .object({
    create: z
      .union([
        z.lazy(() => MetadataCreateWithoutScope1InputObjectSchema),
        z.lazy(() => MetadataUncheckedCreateWithoutScope1InputObjectSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => MetadataCreateOrConnectWithoutScope1InputObjectSchema)
      .optional(),
    connect: z.lazy(() => MetadataWhereUniqueInputObjectSchema).optional(),
  })
  .strict()

export const MetadataCreateNestedOneWithoutScope1InputObjectSchema = Schema
