import { z } from 'zod'
import { Scope3CategoryCreateWithoutMetadataInputObjectSchema } from './Scope3CategoryCreateWithoutMetadataInput.schema'
import { Scope3CategoryUncheckedCreateWithoutMetadataInputObjectSchema } from './Scope3CategoryUncheckedCreateWithoutMetadataInput.schema'
import { Scope3CategoryCreateOrConnectWithoutMetadataInputObjectSchema } from './Scope3CategoryCreateOrConnectWithoutMetadataInput.schema'
import { Scope3CategoryWhereUniqueInputObjectSchema } from './Scope3CategoryWhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CategoryCreateNestedManyWithoutMetadataInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => Scope3CategoryCreateWithoutMetadataInputObjectSchema),
          z
            .lazy(() => Scope3CategoryCreateWithoutMetadataInputObjectSchema)
            .array(),
          z.lazy(
            () => Scope3CategoryUncheckedCreateWithoutMetadataInputObjectSchema
          ),
          z
            .lazy(
              () =>
                Scope3CategoryUncheckedCreateWithoutMetadataInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () => Scope3CategoryCreateOrConnectWithoutMetadataInputObjectSchema
          ),
          z
            .lazy(
              () =>
                Scope3CategoryCreateOrConnectWithoutMetadataInputObjectSchema
            )
            .array(),
        ])
        .optional(),
      connect: z
        .union([
          z.lazy(() => Scope3CategoryWhereUniqueInputObjectSchema),
          z.lazy(() => Scope3CategoryWhereUniqueInputObjectSchema).array(),
        ])
        .optional(),
    })
    .strict()

export const Scope3CategoryCreateNestedManyWithoutMetadataInputObjectSchema =
  Schema
