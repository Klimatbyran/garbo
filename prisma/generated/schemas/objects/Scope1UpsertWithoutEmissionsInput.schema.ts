import { z } from 'zod'
import { Scope1UpdateWithoutEmissionsInputObjectSchema } from './Scope1UpdateWithoutEmissionsInput.schema'
import { Scope1UncheckedUpdateWithoutEmissionsInputObjectSchema } from './Scope1UncheckedUpdateWithoutEmissionsInput.schema'
import { Scope1CreateWithoutEmissionsInputObjectSchema } from './Scope1CreateWithoutEmissionsInput.schema'
import { Scope1UncheckedCreateWithoutEmissionsInputObjectSchema } from './Scope1UncheckedCreateWithoutEmissionsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope1UpsertWithoutEmissionsInput> = z
  .object({
    update: z.union([
      z.lazy(() => Scope1UpdateWithoutEmissionsInputObjectSchema),
      z.lazy(() => Scope1UncheckedUpdateWithoutEmissionsInputObjectSchema),
    ]),
    create: z.union([
      z.lazy(() => Scope1CreateWithoutEmissionsInputObjectSchema),
      z.lazy(() => Scope1UncheckedCreateWithoutEmissionsInputObjectSchema),
    ]),
  })
  .strict()

export const Scope1UpsertWithoutEmissionsInputObjectSchema = Schema
