import { z } from 'zod'
import { MetadataCreateWithoutScope2InputObjectSchema } from './MetadataCreateWithoutScope2Input.schema'
import { MetadataUncheckedCreateWithoutScope2InputObjectSchema } from './MetadataUncheckedCreateWithoutScope2Input.schema'
import { MetadataCreateOrConnectWithoutScope2InputObjectSchema } from './MetadataCreateOrConnectWithoutScope2Input.schema'
import { MetadataWhereUniqueInputObjectSchema } from './MetadataWhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataCreateNestedOneWithoutScope2Input> = z
  .object({
    create: z
      .union([
        z.lazy(() => MetadataCreateWithoutScope2InputObjectSchema),
        z.lazy(() => MetadataUncheckedCreateWithoutScope2InputObjectSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => MetadataCreateOrConnectWithoutScope2InputObjectSchema)
      .optional(),
    connect: z.lazy(() => MetadataWhereUniqueInputObjectSchema).optional(),
  })
  .strict()

export const MetadataCreateNestedOneWithoutScope2InputObjectSchema = Schema
