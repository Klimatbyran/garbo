import { z } from 'zod'
import { CompanyWhereUniqueInputObjectSchema } from './CompanyWhereUniqueInput.schema'
import { CompanyCreateWithoutFiscalYearsInputObjectSchema } from './CompanyCreateWithoutFiscalYearsInput.schema'
import { CompanyUncheckedCreateWithoutFiscalYearsInputObjectSchema } from './CompanyUncheckedCreateWithoutFiscalYearsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyCreateOrConnectWithoutFiscalYearsInput> =
  z
    .object({
      where: z.lazy(() => CompanyWhereUniqueInputObjectSchema),
      create: z.union([
        z.lazy(() => CompanyCreateWithoutFiscalYearsInputObjectSchema),
        z.lazy(() => CompanyUncheckedCreateWithoutFiscalYearsInputObjectSchema),
      ]),
    })
    .strict()

export const CompanyCreateOrConnectWithoutFiscalYearsInputObjectSchema = Schema
