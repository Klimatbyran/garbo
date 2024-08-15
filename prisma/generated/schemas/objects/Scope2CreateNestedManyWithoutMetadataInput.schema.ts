import { z } from 'zod'
import { Scope2CreateWithoutMetadataInputObjectSchema } from './Scope2CreateWithoutMetadataInput.schema'
import { Scope2UncheckedCreateWithoutMetadataInputObjectSchema } from './Scope2UncheckedCreateWithoutMetadataInput.schema'
import { Scope2CreateOrConnectWithoutMetadataInputObjectSchema } from './Scope2CreateOrConnectWithoutMetadataInput.schema'
import { Scope2WhereUniqueInputObjectSchema } from './Scope2WhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope2CreateNestedManyWithoutMetadataInput> = z
  .object({
    create: z
      .union([
        z.lazy(() => Scope2CreateWithoutMetadataInputObjectSchema),
        z.lazy(() => Scope2CreateWithoutMetadataInputObjectSchema).array(),
        z.lazy(() => Scope2UncheckedCreateWithoutMetadataInputObjectSchema),
        z
          .lazy(() => Scope2UncheckedCreateWithoutMetadataInputObjectSchema)
          .array(),
      ])
      .optional(),
    connectOrCreate: z
      .union([
        z.lazy(() => Scope2CreateOrConnectWithoutMetadataInputObjectSchema),
        z
          .lazy(() => Scope2CreateOrConnectWithoutMetadataInputObjectSchema)
          .array(),
      ])
      .optional(),
    connect: z
      .union([
        z.lazy(() => Scope2WhereUniqueInputObjectSchema),
        z.lazy(() => Scope2WhereUniqueInputObjectSchema).array(),
      ])
      .optional(),
  })
  .strict()

export const Scope2CreateNestedManyWithoutMetadataInputObjectSchema = Schema
