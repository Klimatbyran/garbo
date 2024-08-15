import { z } from 'zod'
import { CompanyUpdateWithoutFiscalYearsInputObjectSchema } from './CompanyUpdateWithoutFiscalYearsInput.schema'
import { CompanyUncheckedUpdateWithoutFiscalYearsInputObjectSchema } from './CompanyUncheckedUpdateWithoutFiscalYearsInput.schema'
import { CompanyCreateWithoutFiscalYearsInputObjectSchema } from './CompanyCreateWithoutFiscalYearsInput.schema'
import { CompanyUncheckedCreateWithoutFiscalYearsInputObjectSchema } from './CompanyUncheckedCreateWithoutFiscalYearsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyUpsertWithoutFiscalYearsInput> = z
  .object({
    update: z.union([
      z.lazy(() => CompanyUpdateWithoutFiscalYearsInputObjectSchema),
      z.lazy(() => CompanyUncheckedUpdateWithoutFiscalYearsInputObjectSchema),
    ]),
    create: z.union([
      z.lazy(() => CompanyCreateWithoutFiscalYearsInputObjectSchema),
      z.lazy(() => CompanyUncheckedCreateWithoutFiscalYearsInputObjectSchema),
    ]),
  })
  .strict()

export const CompanyUpsertWithoutFiscalYearsInputObjectSchema = Schema
