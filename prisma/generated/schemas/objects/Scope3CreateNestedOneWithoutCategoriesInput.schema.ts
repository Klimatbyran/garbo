import { z } from 'zod'
import { Scope3CreateWithoutCategoriesInputObjectSchema } from './Scope3CreateWithoutCategoriesInput.schema'
import { Scope3UncheckedCreateWithoutCategoriesInputObjectSchema } from './Scope3UncheckedCreateWithoutCategoriesInput.schema'
import { Scope3CreateOrConnectWithoutCategoriesInputObjectSchema } from './Scope3CreateOrConnectWithoutCategoriesInput.schema'
import { Scope3WhereUniqueInputObjectSchema } from './Scope3WhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CreateNestedOneWithoutCategoriesInput> = z
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
    connect: z.lazy(() => Scope3WhereUniqueInputObjectSchema).optional(),
  })
  .strict()

export const Scope3CreateNestedOneWithoutCategoriesInputObjectSchema = Schema
