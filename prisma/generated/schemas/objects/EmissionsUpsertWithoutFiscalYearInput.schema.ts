import { z } from 'zod'
import { EmissionsUpdateWithoutFiscalYearInputObjectSchema } from './EmissionsUpdateWithoutFiscalYearInput.schema'
import { EmissionsUncheckedUpdateWithoutFiscalYearInputObjectSchema } from './EmissionsUncheckedUpdateWithoutFiscalYearInput.schema'
import { EmissionsCreateWithoutFiscalYearInputObjectSchema } from './EmissionsCreateWithoutFiscalYearInput.schema'
import { EmissionsUncheckedCreateWithoutFiscalYearInputObjectSchema } from './EmissionsUncheckedCreateWithoutFiscalYearInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EmissionsUpsertWithoutFiscalYearInput> = z
  .object({
    update: z.union([
      z.lazy(() => EmissionsUpdateWithoutFiscalYearInputObjectSchema),
      z.lazy(() => EmissionsUncheckedUpdateWithoutFiscalYearInputObjectSchema),
    ]),
    create: z.union([
      z.lazy(() => EmissionsCreateWithoutFiscalYearInputObjectSchema),
      z.lazy(() => EmissionsUncheckedCreateWithoutFiscalYearInputObjectSchema),
    ]),
  })
  .strict()

export const EmissionsUpsertWithoutFiscalYearInputObjectSchema = Schema
