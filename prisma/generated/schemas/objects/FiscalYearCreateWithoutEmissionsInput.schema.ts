import { z } from 'zod'
import { EconomyCreateNestedOneWithoutFiscalYearInputObjectSchema } from './EconomyCreateNestedOneWithoutFiscalYearInput.schema'
import { CompanyCreateNestedOneWithoutFiscalYearsInputObjectSchema } from './CompanyCreateNestedOneWithoutFiscalYearsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.FiscalYearCreateWithoutEmissionsInput> = z
  .object({
    startYear: z.number(),
    endYear: z.number().optional().nullable(),
    startMonth: z.string().optional().nullable(),
    emissionsId: z.number(),
    economy: z
      .lazy(() => EconomyCreateNestedOneWithoutFiscalYearInputObjectSchema)
      .optional(),
    company: z.lazy(
      () => CompanyCreateNestedOneWithoutFiscalYearsInputObjectSchema
    ),
  })
  .strict()

export const FiscalYearCreateWithoutEmissionsInputObjectSchema = Schema
