import { z } from 'zod'
import { Scope1CreateWithoutEmissionsInputObjectSchema } from './Scope1CreateWithoutEmissionsInput.schema'
import { Scope1UncheckedCreateWithoutEmissionsInputObjectSchema } from './Scope1UncheckedCreateWithoutEmissionsInput.schema'
import { Scope1CreateOrConnectWithoutEmissionsInputObjectSchema } from './Scope1CreateOrConnectWithoutEmissionsInput.schema'
import { Scope1WhereUniqueInputObjectSchema } from './Scope1WhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope1UncheckedCreateNestedOneWithoutEmissionsInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => Scope1CreateWithoutEmissionsInputObjectSchema),
          z.lazy(() => Scope1UncheckedCreateWithoutEmissionsInputObjectSchema),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => Scope1CreateOrConnectWithoutEmissionsInputObjectSchema)
        .optional(),
      connect: z.lazy(() => Scope1WhereUniqueInputObjectSchema).optional(),
    })
    .strict()

export const Scope1UncheckedCreateNestedOneWithoutEmissionsInputObjectSchema =
  Schema
