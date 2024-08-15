import { z } from 'zod'
import { Scope1WhereUniqueInputObjectSchema } from './Scope1WhereUniqueInput.schema'
import { Scope1CreateWithoutEmissionsInputObjectSchema } from './Scope1CreateWithoutEmissionsInput.schema'
import { Scope1UncheckedCreateWithoutEmissionsInputObjectSchema } from './Scope1UncheckedCreateWithoutEmissionsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope1CreateOrConnectWithoutEmissionsInput> = z
  .object({
    where: z.lazy(() => Scope1WhereUniqueInputObjectSchema),
    create: z.union([
      z.lazy(() => Scope1CreateWithoutEmissionsInputObjectSchema),
      z.lazy(() => Scope1UncheckedCreateWithoutEmissionsInputObjectSchema),
    ]),
  })
  .strict()

export const Scope1CreateOrConnectWithoutEmissionsInputObjectSchema = Schema
