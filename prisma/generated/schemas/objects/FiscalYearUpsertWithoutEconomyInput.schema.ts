import { z } from 'zod'
import { FiscalYearUpdateWithoutEconomyInputObjectSchema } from './FiscalYearUpdateWithoutEconomyInput.schema'
import { FiscalYearUncheckedUpdateWithoutEconomyInputObjectSchema } from './FiscalYearUncheckedUpdateWithoutEconomyInput.schema'
import { FiscalYearCreateWithoutEconomyInputObjectSchema } from './FiscalYearCreateWithoutEconomyInput.schema'
import { FiscalYearUncheckedCreateWithoutEconomyInputObjectSchema } from './FiscalYearUncheckedCreateWithoutEconomyInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.FiscalYearUpsertWithoutEconomyInput> = z
  .object({
    update: z.union([
      z.lazy(() => FiscalYearUpdateWithoutEconomyInputObjectSchema),
      z.lazy(() => FiscalYearUncheckedUpdateWithoutEconomyInputObjectSchema),
    ]),
    create: z.union([
      z.lazy(() => FiscalYearCreateWithoutEconomyInputObjectSchema),
      z.lazy(() => FiscalYearUncheckedCreateWithoutEconomyInputObjectSchema),
    ]),
  })
  .strict()

export const FiscalYearUpsertWithoutEconomyInputObjectSchema = Schema
