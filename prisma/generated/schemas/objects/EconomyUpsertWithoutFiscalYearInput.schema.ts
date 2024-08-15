import { z } from 'zod'
import { EconomyUpdateWithoutFiscalYearInputObjectSchema } from './EconomyUpdateWithoutFiscalYearInput.schema'
import { EconomyUncheckedUpdateWithoutFiscalYearInputObjectSchema } from './EconomyUncheckedUpdateWithoutFiscalYearInput.schema'
import { EconomyCreateWithoutFiscalYearInputObjectSchema } from './EconomyCreateWithoutFiscalYearInput.schema'
import { EconomyUncheckedCreateWithoutFiscalYearInputObjectSchema } from './EconomyUncheckedCreateWithoutFiscalYearInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EconomyUpsertWithoutFiscalYearInput> = z
  .object({
    update: z.union([
      z.lazy(() => EconomyUpdateWithoutFiscalYearInputObjectSchema),
      z.lazy(() => EconomyUncheckedUpdateWithoutFiscalYearInputObjectSchema),
    ]),
    create: z.union([
      z.lazy(() => EconomyCreateWithoutFiscalYearInputObjectSchema),
      z.lazy(() => EconomyUncheckedCreateWithoutFiscalYearInputObjectSchema),
    ]),
  })
  .strict()

export const EconomyUpsertWithoutFiscalYearInputObjectSchema = Schema
