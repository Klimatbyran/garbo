import { z } from 'zod'
import { Scope3CreateWithoutEmissionsInputObjectSchema } from './Scope3CreateWithoutEmissionsInput.schema'
import { Scope3UncheckedCreateWithoutEmissionsInputObjectSchema } from './Scope3UncheckedCreateWithoutEmissionsInput.schema'
import { Scope3CreateOrConnectWithoutEmissionsInputObjectSchema } from './Scope3CreateOrConnectWithoutEmissionsInput.schema'
import { Scope3WhereUniqueInputObjectSchema } from './Scope3WhereUniqueInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CreateNestedOneWithoutEmissionsInput> = z
  .object({
    create: z
      .union([
        z.lazy(() => Scope3CreateWithoutEmissionsInputObjectSchema),
        z.lazy(() => Scope3UncheckedCreateWithoutEmissionsInputObjectSchema),
      ])
      .optional(),
    connectOrCreate: z
      .lazy(() => Scope3CreateOrConnectWithoutEmissionsInputObjectSchema)
      .optional(),
    connect: z.lazy(() => Scope3WhereUniqueInputObjectSchema).optional(),
  })
  .strict()

export const Scope3CreateNestedOneWithoutEmissionsInputObjectSchema = Schema
