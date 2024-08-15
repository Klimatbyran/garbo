import { z } from 'zod'
import { Scope1CreateWithoutEmissionsInputObjectSchema } from './Scope1CreateWithoutEmissionsInput.schema'
import { Scope1UncheckedCreateWithoutEmissionsInputObjectSchema } from './Scope1UncheckedCreateWithoutEmissionsInput.schema'
import { Scope1CreateOrConnectWithoutEmissionsInputObjectSchema } from './Scope1CreateOrConnectWithoutEmissionsInput.schema'
import { Scope1UpsertWithoutEmissionsInputObjectSchema } from './Scope1UpsertWithoutEmissionsInput.schema'
import { Scope1WhereUniqueInputObjectSchema } from './Scope1WhereUniqueInput.schema'
import { Scope1UpdateWithoutEmissionsInputObjectSchema } from './Scope1UpdateWithoutEmissionsInput.schema'
import { Scope1UncheckedUpdateWithoutEmissionsInputObjectSchema } from './Scope1UncheckedUpdateWithoutEmissionsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope1UpdateOneWithoutEmissionsNestedInput> = z
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
    upsert: z
      .lazy(() => Scope1UpsertWithoutEmissionsInputObjectSchema)
      .optional(),
    disconnect: z.boolean().optional(),
    delete: z.boolean().optional(),
    connect: z.lazy(() => Scope1WhereUniqueInputObjectSchema).optional(),
    update: z
      .union([
        z.lazy(() => Scope1UpdateWithoutEmissionsInputObjectSchema),
        z.lazy(() => Scope1UncheckedUpdateWithoutEmissionsInputObjectSchema),
      ])
      .optional(),
  })
  .strict()

export const Scope1UpdateOneWithoutEmissionsNestedInputObjectSchema = Schema
