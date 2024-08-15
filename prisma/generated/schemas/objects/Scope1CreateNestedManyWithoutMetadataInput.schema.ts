import { z } from 'zod'
import { Scope1CreateWithoutMetadataInputObjectSchema } from './Scope1CreateWithoutMetadataInput.schema'
import { Scope1UncheckedCreateWithoutMetadataInputObjectSchema } from './Scope1UncheckedCreateWithoutMetadataInput.schema'
import { Scope1CreateOrConnectWithoutMetadataInputObjectSchema } from './Scope1CreateOrConnectWithoutMetadataInput.schema'
import { Scope1WhereUniqueInputObjectSchema } from './Scope1WhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope1CreateNestedManyWithoutMetadataInput> = z
  .object({
    create: z
      .union([
        z.lazy(() => Scope1CreateWithoutMetadataInputObjectSchema),
        z.lazy(() => Scope1CreateWithoutMetadataInputObjectSchema).array(),
        z.lazy(() => Scope1UncheckedCreateWithoutMetadataInputObjectSchema),
        z
          .lazy(() => Scope1UncheckedCreateWithoutMetadataInputObjectSchema)
          .array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => Scope1CreateOrConnectWithoutMetadataInputObjectSchema),
        z
          .lazy(() => Scope1CreateOrConnectWithoutMetadataInputObjectSchema)
          .array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => Scope1WhereUniqueInputObjectSchema),
        z.lazy(() => Scope1WhereUniqueInputObjectSchema).array(),
      ])
      .optional(),
  })
  .strict()

export const Scope1CreateNestedManyWithoutMetadataInputObjectSchema = Schema
