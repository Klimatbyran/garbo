import { z } from 'zod'
import { Scope3UpdateWithoutEmissionsInputObjectSchema } from './Scope3UpdateWithoutEmissionsInput.schema'
import { Scope3UncheckedUpdateWithoutEmissionsInputObjectSchema } from './Scope3UncheckedUpdateWithoutEmissionsInput.schema'
import { Scope3CreateWithoutEmissionsInputObjectSchema } from './Scope3CreateWithoutEmissionsInput.schema'
import { Scope3UncheckedCreateWithoutEmissionsInputObjectSchema } from './Scope3UncheckedCreateWithoutEmissionsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3UpsertWithoutEmissionsInput> = z
  .object({
    update: z.union([
      z.lazy(() => Scope3UpdateWithoutEmissionsInputObjectSchema),
      z.lazy(() => Scope3UncheckedUpdateWithoutEmissionsInputObjectSchema),
    ]),
    create: z.union([
      z.lazy(() => Scope3CreateWithoutEmissionsInputObjectSchema),
      z.lazy(() => Scope3UncheckedCreateWithoutEmissionsInputObjectSchema),
    ]),
  })
  .strict()

export const Scope3UpsertWithoutEmissionsInputObjectSchema = Schema
