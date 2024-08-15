import { z } from 'zod'
import { Scope3UpdateWithoutCategoriesInputObjectSchema } from './Scope3UpdateWithoutCategoriesInput.schema'
import { Scope3UncheckedUpdateWithoutCategoriesInputObjectSchema } from './Scope3UncheckedUpdateWithoutCategoriesInput.schema'
import { Scope3CreateWithoutCategoriesInputObjectSchema } from './Scope3CreateWithoutCategoriesInput.schema'
import { Scope3UncheckedCreateWithoutCategoriesInputObjectSchema } from './Scope3UncheckedCreateWithoutCategoriesInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3UpsertWithoutCategoriesInput> = z
  .object({
    update: z.union([
      z.lazy(() => Scope3UpdateWithoutCategoriesInputObjectSchema),
      z.lazy(() => Scope3UncheckedUpdateWithoutCategoriesInputObjectSchema),
    ]),
    create: z.union([
      z.lazy(() => Scope3CreateWithoutCategoriesInputObjectSchema),
      z.lazy(() => Scope3UncheckedCreateWithoutCategoriesInputObjectSchema),
    ]),
  })
  .strict()

export const Scope3UpsertWithoutCategoriesInputObjectSchema = Schema
