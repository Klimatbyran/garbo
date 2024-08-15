import { z } from 'zod'
import { Scope2WhereUniqueInputObjectSchema } from './Scope2WhereUniqueInput.schema'
import { Scope2CreateWithoutEmissionsInputObjectSchema } from './Scope2CreateWithoutEmissionsInput.schema'
import { Scope2UncheckedCreateWithoutEmissionsInputObjectSchema } from './Scope2UncheckedCreateWithoutEmissionsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope2CreateOrConnectWithoutEmissionsInput> = z
  .object({
    where: z.lazy(() => Scope2WhereUniqueInputObjectSchema),
    create: z.union([
      z.lazy(() => Scope2CreateWithoutEmissionsInputObjectSchema),
      z.lazy(() => Scope2UncheckedCreateWithoutEmissionsInputObjectSchema),
    ]),
  })
  .strict()

export const Scope2CreateOrConnectWithoutEmissionsInputObjectSchema = Schema
