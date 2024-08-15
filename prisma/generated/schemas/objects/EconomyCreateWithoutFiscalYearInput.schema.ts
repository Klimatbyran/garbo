import { z } from 'zod'
import { MetadataCreateNestedOneWithoutEconomyInputObjectSchema } from './MetadataCreateNestedOneWithoutEconomyInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EconomyCreateWithoutFiscalYearInput> = z
  .object({
    turnover: z.number(),
    unit: z.string(),
    employees: z.number(),
    metadata: z.lazy(
      () => MetadataCreateNestedOneWithoutEconomyInputObjectSchema
    ),
  })
  .strict()

export const EconomyCreateWithoutFiscalYearInputObjectSchema = Schema
