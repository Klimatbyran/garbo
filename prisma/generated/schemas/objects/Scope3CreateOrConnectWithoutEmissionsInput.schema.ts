import { z } from 'zod'
import { Scope3WhereUniqueInputObjectSchema } from './Scope3WhereUniqueInput.schema'
import { Scope3CreateWithoutEmissionsInputObjectSchema } from './Scope3CreateWithoutEmissionsInput.schema'
import { Scope3UncheckedCreateWithoutEmissionsInputObjectSchema } from './Scope3UncheckedCreateWithoutEmissionsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CreateOrConnectWithoutEmissionsInput> = z
  .object({
    where: z.lazy(() => Scope3WhereUniqueInputObjectSchema),
    create: z.union([
      z.lazy(() => Scope3CreateWithoutEmissionsInputObjectSchema),
      z.lazy(() => Scope3UncheckedCreateWithoutEmissionsInputObjectSchema),
    ]),
  })
  .strict()

export const Scope3CreateOrConnectWithoutEmissionsInputObjectSchema = Schema
