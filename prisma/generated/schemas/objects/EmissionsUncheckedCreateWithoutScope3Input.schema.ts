import { z } from 'zod'
import { Scope1UncheckedCreateNestedOneWithoutEmissionsInputObjectSchema } from './Scope1UncheckedCreateNestedOneWithoutEmissionsInput.schema'
import { Scope2UncheckedCreateNestedOneWithoutEmissionsInputObjectSchema } from './Scope2UncheckedCreateNestedOneWithoutEmissionsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EmissionsUncheckedCreateWithoutScope3Input> = z
  .object({
    id: z.number().optional(),
    fiscalYearId: z.number(),
    scope1Id: z.number(),
    scope2Id: z.number(),
    scope3Id: z.number(),
    scope1: z
      .lazy(
        () => Scope1UncheckedCreateNestedOneWithoutEmissionsInputObjectSchema
      )
      .optional(),
    scope2: z
      .lazy(
        () => Scope2UncheckedCreateNestedOneWithoutEmissionsInputObjectSchema
      )
      .optional(),
  })
  .strict()

export const EmissionsUncheckedCreateWithoutScope3InputObjectSchema = Schema
