import { z } from 'zod'
import { EmissionsUncheckedCreateNestedOneWithoutFiscalYearInputObjectSchema } from './EmissionsUncheckedCreateNestedOneWithoutFiscalYearInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.FiscalYearUncheckedCreateWithoutEconomyInput> = z
  .object({
    id: z.number().optional(),
    startYear: z.number(),
    endYear: z.number().optional().nullable(),
    startMonth: z.string().optional().nullable(),
    companyId: z.number(),
    emissionsId: z.number(),
    emissions: z
      .lazy(
        () =>
          EmissionsUncheckedCreateNestedOneWithoutFiscalYearInputObjectSchema
      )
      .optional(),
  })
  .strict()

export const FiscalYearUncheckedCreateWithoutEconomyInputObjectSchema = Schema
