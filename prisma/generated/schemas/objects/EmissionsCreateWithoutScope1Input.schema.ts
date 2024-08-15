import { z } from 'zod'
import { FiscalYearCreateNestedOneWithoutEmissionsInputObjectSchema } from './FiscalYearCreateNestedOneWithoutEmissionsInput.schema'
import { Scope2CreateNestedOneWithoutEmissionsInputObjectSchema } from './Scope2CreateNestedOneWithoutEmissionsInput.schema'
import { Scope3CreateNestedOneWithoutEmissionsInputObjectSchema } from './Scope3CreateNestedOneWithoutEmissionsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EmissionsCreateWithoutScope1Input> = z
  .object({
    scope1Id: z.number(),
    scope2Id: z.number(),
    scope3Id: z.number(),
    fiscalYear: z.lazy(
      () => FiscalYearCreateNestedOneWithoutEmissionsInputObjectSchema
    ),
    scope2: z
      .lazy(() => Scope2CreateNestedOneWithoutEmissionsInputObjectSchema)
      .optional(),
    scope3: z
      .lazy(() => Scope3CreateNestedOneWithoutEmissionsInputObjectSchema)
      .optional(),
  })
  .strict()

export const EmissionsCreateWithoutScope1InputObjectSchema = Schema
