import { z } from 'zod'
import { Scope3CategoryCreateWithoutScope3InputObjectSchema } from './Scope3CategoryCreateWithoutScope3Input.schema'
import { Scope3CategoryUncheckedCreateWithoutScope3InputObjectSchema } from './Scope3CategoryUncheckedCreateWithoutScope3Input.schema'
import { Scope3CategoryCreateOrConnectWithoutScope3InputObjectSchema } from './Scope3CategoryCreateOrConnectWithoutScope3Input.schema'
import { Scope3CategoryWhereUniqueInputObjectSchema } from './Scope3CategoryWhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CategoryUncheckedCreateNestedManyWithoutScope3Input> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => Scope3CategoryCreateWithoutScope3InputObjectSchema),
          z
            .lazy(() => Scope3CategoryCreateWithoutScope3InputObjectSchema)
            .array(),
          z.lazy(
            () => Scope3CategoryUncheckedCreateWithoutScope3InputObjectSchema
          ),
          z
            .lazy(
              () => Scope3CategoryUncheckedCreateWithoutScope3InputObjectSchema
            )
            .array(),
        ])
        .optional(),
      connectOrCreate: z
        .union([
          z.lazy(
            () => Scope3CategoryCreateOrConnectWithoutScope3InputObjectSchema
          ),
          z
            .lazy(
              () => Scope3CategoryCreateOrConnectWithoutScope3InputObjectSchema
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

export const Scope3CategoryUncheckedCreateNestedManyWithoutScope3InputObjectSchema =
  Schema
