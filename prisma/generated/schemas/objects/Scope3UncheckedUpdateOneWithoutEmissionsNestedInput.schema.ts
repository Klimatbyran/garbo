import { z } from 'zod'
import { Scope3CreateWithoutEmissionsInputObjectSchema } from './Scope3CreateWithoutEmissionsInput.schema'
import { Scope3UncheckedCreateWithoutEmissionsInputObjectSchema } from './Scope3UncheckedCreateWithoutEmissionsInput.schema'
import { Scope3CreateOrConnectWithoutEmissionsInputObjectSchema } from './Scope3CreateOrConnectWithoutEmissionsInput.schema'
import { Scope3UpsertWithoutEmissionsInputObjectSchema } from './Scope3UpsertWithoutEmissionsInput.schema'
import { Scope3WhereUniqueInputObjectSchema } from './Scope3WhereUniqueInput.schema'
import { Scope3UpdateWithoutEmissionsInputObjectSchema } from './Scope3UpdateWithoutEmissionsInput.schema'
import { Scope3UncheckedUpdateWithoutEmissionsInputObjectSchema } from './Scope3UncheckedUpdateWithoutEmissionsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3UncheckedUpdateOneWithoutEmissionsNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => Scope3CreateWithoutEmissionsInputObjectSchema),
          z.lazy(() => Scope3UncheckedCreateWithoutEmissionsInputObjectSchema),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => Scope3CreateOrConnectWithoutEmissionsInputObjectSchema)
        .optional(),
      upsert: z
        .lazy(() => Scope3UpsertWithoutEmissionsInputObjectSchema)
        .optional(),
      disconnect: z.boolean().optional(),
      delete: z.boolean().optional(),
      connect: z.lazy(() => Scope3WhereUniqueInputObjectSchema).optional(),
      update: z
        .union([
          z.lazy(() => Scope3UpdateWithoutEmissionsInputObjectSchema),
          z.lazy(() => Scope3UncheckedUpdateWithoutEmissionsInputObjectSchema),
        ])
        .optional(),
    })
    .strict()

export const Scope3UncheckedUpdateOneWithoutEmissionsNestedInputObjectSchema =
  Schema
