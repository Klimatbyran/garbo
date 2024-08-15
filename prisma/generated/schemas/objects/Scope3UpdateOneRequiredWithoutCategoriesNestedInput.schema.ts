import { z } from 'zod'
import { Scope3CreateWithoutCategoriesInputObjectSchema } from './Scope3CreateWithoutCategoriesInput.schema'
import { Scope3UncheckedCreateWithoutCategoriesInputObjectSchema } from './Scope3UncheckedCreateWithoutCategoriesInput.schema'
import { Scope3CreateOrConnectWithoutCategoriesInputObjectSchema } from './Scope3CreateOrConnectWithoutCategoriesInput.schema'
import { Scope3UpsertWithoutCategoriesInputObjectSchema } from './Scope3UpsertWithoutCategoriesInput.schema'
import { Scope3WhereUniqueInputObjectSchema } from './Scope3WhereUniqueInput.schema'
import { Scope3UpdateWithoutCategoriesInputObjectSchema } from './Scope3UpdateWithoutCategoriesInput.schema'
import { Scope3UncheckedUpdateWithoutCategoriesInputObjectSchema } from './Scope3UncheckedUpdateWithoutCategoriesInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3UpdateOneRequiredWithoutCategoriesNestedInput> =
  z
    .object({
      create: z
        .union([
          z.lazy(() => Scope3CreateWithoutCategoriesInputObjectSchema),
          z.lazy(() => Scope3UncheckedCreateWithoutCategoriesInputObjectSchema),
        ])
        .optional(),
      connectOrCreate: z
        .lazy(() => Scope3CreateOrConnectWithoutCategoriesInputObjectSchema)
        .optional(),
      upsert: z
        .lazy(() => Scope3UpsertWithoutCategoriesInputObjectSchema)
        .optional(),
      connect: z.lazy(() => Scope3WhereUniqueInputObjectSchema).optional(),
      update: z
        .union([
          z.lazy(() => Scope3UpdateWithoutCategoriesInputObjectSchema),
          z.lazy(() => Scope3UncheckedUpdateWithoutCategoriesInputObjectSchema),
        ])
        .optional(),
    })
    .strict()

export const Scope3UpdateOneRequiredWithoutCategoriesNestedInputObjectSchema =
  Schema
