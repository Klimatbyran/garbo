import { z } from 'zod'
import { Scope3CreateWithoutMetadataInputObjectSchema } from './Scope3CreateWithoutMetadataInput.schema'
import { Scope3UncheckedCreateWithoutMetadataInputObjectSchema } from './Scope3UncheckedCreateWithoutMetadataInput.schema'
import { Scope3CreateOrConnectWithoutMetadataInputObjectSchema } from './Scope3CreateOrConnectWithoutMetadataInput.schema'
import { Scope3WhereUniqueInputObjectSchema } from './Scope3WhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3UncheckedCreateNestedManyWithoutMetadataInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => Scope3CreateWithoutMetadataInputObjectSchema),
          z.lazy(() => Scope3CreateWithoutMetadataInputObjectSchema).array(),
          z.lazy(() => Scope3UncheckedCreateWithoutMetadataInputObjectSchema),
          z
            .lazy(() => Scope3UncheckedCreateWithoutMetadataInputObjectSchema)
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(() => Scope3CreateOrConnectWithoutMetadataInputObjectSchema),
          z
            .lazy(() => Scope3CreateOrConnectWithoutMetadataInputObjectSchema)
            .array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => Scope3WhereUniqueInputObjectSchema),
          z.lazy(() => Scope3WhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
    })
    .strict()

export const Scope3UncheckedCreateNestedManyWithoutMetadataInputObjectSchema =
  Schema
