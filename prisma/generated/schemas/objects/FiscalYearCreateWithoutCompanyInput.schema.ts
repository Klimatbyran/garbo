import { z } from 'zod'
import { EconomyCreateNestedOneWithoutFiscalYearInputObjectSchema } from './EconomyCreateNestedOneWithoutFiscalYearInput.schema'
import { EmissionsCreateNestedOneWithoutFiscalYearInputObjectSchema } from './EmissionsCreateNestedOneWithoutFiscalYearInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.FiscalYearCreateWithoutCompanyInput> = z
  .object({
    startYear: z.number(),
    endYear: z.number().optional().nullable(),
    startMonth: z.string().optional().nullable(),
    emissionsId: z.number(),
    economy: z
      .lazy(() => EconomyCreateNestedOneWithoutFiscalYearInputObjectSchema)
      .optional(),
    emissions: z
      .lazy(() => EmissionsCreateNestedOneWithoutFiscalYearInputObjectSchema)
      .optional(),
  })
  .strict()

export const FiscalYearCreateWithoutCompanyInputObjectSchema = Schema
