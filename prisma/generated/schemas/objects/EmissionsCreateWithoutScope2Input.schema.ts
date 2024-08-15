import { z } from 'zod'
import { FiscalYearCreateNestedOneWithoutEmissionsInputObjectSchema } from './FiscalYearCreateNestedOneWithoutEmissionsInput.schema'
import { Scope1CreateNestedOneWithoutEmissionsInputObjectSchema } from './Scope1CreateNestedOneWithoutEmissionsInput.schema'
import { Scope3CreateNestedOneWithoutEmissionsInputObjectSchema } from './Scope3CreateNestedOneWithoutEmissionsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EmissionsCreateWithoutScope2Input> = z
  .object({
    scope1Id: z.number(),
    scope2Id: z.number(),
    scope3Id: z.number(),
    fiscalYear: z.lazy(
      () => FiscalYearCreateNestedOneWithoutEmissionsInputObjectSchema
    ),
    scope1: z
      .lazy(() => Scope1CreateNestedOneWithoutEmissionsInputObjectSchema)
      .optional(),
    scope3: z
      .lazy(() => Scope3CreateNestedOneWithoutEmissionsInputObjectSchema)
      .optional(),
  })
  .strict()

export const EmissionsCreateWithoutScope2InputObjectSchema = Schema
