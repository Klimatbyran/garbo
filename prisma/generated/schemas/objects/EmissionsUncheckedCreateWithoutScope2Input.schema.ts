import { z } from 'zod'
import { Scope1UncheckedCreateNestedOneWithoutEmissionsInputObjectSchema } from './Scope1UncheckedCreateNestedOneWithoutEmissionsInput.schema'
import { Scope3UncheckedCreateNestedOneWithoutEmissionsInputObjectSchema } from './Scope3UncheckedCreateNestedOneWithoutEmissionsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EmissionsUncheckedCreateWithoutScope2Input> = z
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
    scope3: z
      .lazy(
        () => Scope3UncheckedCreateNestedOneWithoutEmissionsInputObjectSchema
      )
      .optional(),
  })
  .strict()

export const EmissionsUncheckedCreateWithoutScope2InputObjectSchema = Schema
