import { z } from 'zod'
import { FiscalYearCreateNestedOneWithoutEconomyInputObjectSchema } from './FiscalYearCreateNestedOneWithoutEconomyInput.schema'
import { MetadataCreateNestedOneWithoutEconomyInputObjectSchema } from './MetadataCreateNestedOneWithoutEconomyInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EconomyCreateInput> = z
  .object({
    turnover: z.number(),
    unit: z.string(),
    employees: z.number(),
    fiscalYear: z.lazy(
      () => FiscalYearCreateNestedOneWithoutEconomyInputObjectSchema
    ),
    metadata: z.lazy(
      () => MetadataCreateNestedOneWithoutEconomyInputObjectSchema
    ),
  })
  .strict()

export const EconomyCreateInputObjectSchema = Schema
