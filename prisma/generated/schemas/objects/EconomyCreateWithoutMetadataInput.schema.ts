import { z } from 'zod'
import { FiscalYearCreateNestedOneWithoutEconomyInputObjectSchema } from './FiscalYearCreateNestedOneWithoutEconomyInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EconomyCreateWithoutMetadataInput> = z
  .object({
    turnover: z.number(),
    unit: z.string(),
    employees: z.number(),
    fiscalYear: z.lazy(
      () => FiscalYearCreateNestedOneWithoutEconomyInputObjectSchema
    ),
  })
  .strict()

export const EconomyCreateWithoutMetadataInputObjectSchema = Schema
