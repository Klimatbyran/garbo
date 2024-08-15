import { z } from 'zod'
import { FiscalYearUpdateWithoutEmissionsInputObjectSchema } from './FiscalYearUpdateWithoutEmissionsInput.schema'
import { FiscalYearUncheckedUpdateWithoutEmissionsInputObjectSchema } from './FiscalYearUncheckedUpdateWithoutEmissionsInput.schema'
import { FiscalYearCreateWithoutEmissionsInputObjectSchema } from './FiscalYearCreateWithoutEmissionsInput.schema'
import { FiscalYearUncheckedCreateWithoutEmissionsInputObjectSchema } from './FiscalYearUncheckedCreateWithoutEmissionsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.FiscalYearUpsertWithoutEmissionsInput> = z
  .object({
    update: z.union([
      z.lazy(() => FiscalYearUpdateWithoutEmissionsInputObjectSchema),
      z.lazy(() => FiscalYearUncheckedUpdateWithoutEmissionsInputObjectSchema),
    ]),
    create: z.union([
      z.lazy(() => FiscalYearCreateWithoutEmissionsInputObjectSchema),
      z.lazy(() => FiscalYearUncheckedCreateWithoutEmissionsInputObjectSchema),
    ]),
  })
  .strict()

export const FiscalYearUpsertWithoutEmissionsInputObjectSchema = Schema
