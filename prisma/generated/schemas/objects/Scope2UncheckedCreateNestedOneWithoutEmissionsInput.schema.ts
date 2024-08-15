import { z } from 'zod'
import { Scope2CreateWithoutEmissionsInputObjectSchema } from './Scope2CreateWithoutEmissionsInput.schema'
import { Scope2UncheckedCreateWithoutEmissionsInputObjectSchema } from './Scope2UncheckedCreateWithoutEmissionsInput.schema'
import { Scope2CreateOrConnectWithoutEmissionsInputObjectSchema } from './Scope2CreateOrConnectWithoutEmissionsInput.schema'
import { Scope2WhereUniqueInputObjectSchema } from './Scope2WhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope2UncheckedCreateNestedOneWithoutEmissionsInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => Scope2CreateWithoutEmissionsInputObjectSchema),
          z.lazy(() => Scope2UncheckedCreateWithoutEmissionsInputObjectSchema),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => Scope2CreateOrConnectWithoutEmissionsInputObjectSchema)
        .optional(),
      connect: z.lazy(() => Scope2WhereUniqueInputObjectSchema).optional(),
    })
    .strict()

export const Scope2UncheckedCreateNestedOneWithoutEmissionsInputObjectSchema =
  Schema
