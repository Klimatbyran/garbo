import { z } from 'zod'
import { Scope3WhereUniqueInputObjectSchema } from './Scope3WhereUniqueInput.schema'
import { Scope3CreateWithoutCategoriesInputObjectSchema } from './Scope3CreateWithoutCategoriesInput.schema'
import { Scope3UncheckedCreateWithoutCategoriesInputObjectSchema } from './Scope3UncheckedCreateWithoutCategoriesInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CreateOrConnectWithoutCategoriesInput> = z
  .object({
    where: z.lazy(() => Scope3WhereUniqueInputObjectSchema),
    create: z.union([
      z.lazy(() => Scope3CreateWithoutCategoriesInputObjectSchema),
      z.lazy(() => Scope3UncheckedCreateWithoutCategoriesInputObjectSchema),
    ]),
  })
  .strict()

export const Scope3CreateOrConnectWithoutCategoriesInputObjectSchema = Schema
