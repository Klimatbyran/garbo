import { z } from 'zod'
import { EconomyUncheckedCreateNestedOneWithoutFiscalYearInputObjectSchema } from './EconomyUncheckedCreateNestedOneWithoutFiscalYearInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.FiscalYearUncheckedCreateWithoutEmissionsInput> =
  z
    .object({
      id: z.number().optional(),
      startYear: z.number(),
      endYear: z.number().optional().nullable(),
      startMonth: z.string().optional().nullable(),
      companyId: z.number(),
      emissionsId: z.number(),
      economy: z
        .lazy(
          () =>
            EconomyUncheckedCreateNestedOneWithoutFiscalYearInputObjectSchema
        )
        .optional(),
    })
    .strict()

export const FiscalYearUncheckedCreateWithoutEmissionsInputObjectSchema = Schema
