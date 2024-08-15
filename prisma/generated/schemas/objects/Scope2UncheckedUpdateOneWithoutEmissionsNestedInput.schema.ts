import { z } from 'zod'
import { Scope2CreateWithoutEmissionsInputObjectSchema } from './Scope2CreateWithoutEmissionsInput.schema'
import { Scope2UncheckedCreateWithoutEmissionsInputObjectSchema } from './Scope2UncheckedCreateWithoutEmissionsInput.schema'
import { Scope2CreateOrConnectWithoutEmissionsInputObjectSchema } from './Scope2CreateOrConnectWithoutEmissionsInput.schema'
import { Scope2UpsertWithoutEmissionsInputObjectSchema } from './Scope2UpsertWithoutEmissionsInput.schema'
import { Scope2WhereUniqueInputObjectSchema } from './Scope2WhereUniqueInput.schema'
import { Scope2UpdateWithoutEmissionsInputObjectSchema } from './Scope2UpdateWithoutEmissionsInput.schema'
import { Scope2UncheckedUpdateWithoutEmissionsInputObjectSchema } from './Scope2UncheckedUpdateWithoutEmissionsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope2UncheckedUpdateOneWithoutEmissionsNestedInput> =
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
      upsert: z
        .lazy(() => Scope2UpsertWithoutEmissionsInputObjectSchema)
        .optional(),
      disconnect: z.boolean().optional(),
      delete: z.boolean().optional(),
      connect: z.lazy(() => Scope2WhereUniqueInputObjectSchema).optional(),
      update: z
        .union([
          z.lazy(() => Scope2UpdateWithoutEmissionsInputObjectSchema),
          z.lazy(() => Scope2UncheckedUpdateWithoutEmissionsInputObjectSchema),
        ])
        .optional(),
    })
    .strict()

export const Scope2UncheckedUpdateOneWithoutEmissionsNestedInputObjectSchema =
  Schema
