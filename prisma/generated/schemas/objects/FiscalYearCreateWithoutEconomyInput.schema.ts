import { z } from 'zod'
import { EmissionsCreateNestedOneWithoutFiscalYearInputObjectSchema } from './EmissionsCreateNestedOneWithoutFiscalYearInput.schema'
import { CompanyCreateNestedOneWithoutFiscalYearsInputObjectSchema } from './CompanyCreateNestedOneWithoutFiscalYearsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.FiscalYearCreateWithoutEconomyInput> = z
  .object({
    startYear: z.number(),
    endYear: z.number().optional().nullable(),
    startMonth: z.string().optional().nullable(),
    emissionsId: z.number(),
    emissions: z
      .lazy(() => EmissionsCreateNestedOneWithoutFiscalYearInputObjectSchema)
      .optional(),
    company: z.lazy(
      () => CompanyCreateNestedOneWithoutFiscalYearsInputObjectSchema
    ),
  })
  .strict()

export const FiscalYearCreateWithoutEconomyInputObjectSchema = Schema
