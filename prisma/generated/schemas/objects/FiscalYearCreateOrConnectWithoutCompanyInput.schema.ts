import { z } from 'zod'
import { FiscalYearWhereUniqueInputObjectSchema } from './FiscalYearWhereUniqueInput.schema'
import { FiscalYearCreateWithoutCompanyInputObjectSchema } from './FiscalYearCreateWithoutCompanyInput.schema'
import { FiscalYearUncheckedCreateWithoutCompanyInputObjectSchema } from './FiscalYearUncheckedCreateWithoutCompanyInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.FiscalYearCreateOrConnectWithoutCompanyInput> = z
  .object({
    where: z.lazy(() => FiscalYearWhereUniqueInputObjectSchema),
    create: z.union([
      z.lazy(() => FiscalYearCreateWithoutCompanyInputObjectSchema),
      z.lazy(() => FiscalYearUncheckedCreateWithoutCompanyInputObjectSchema),
    ]),
  })
  .strict()

export const FiscalYearCreateOrConnectWithoutCompanyInputObjectSchema = Schema
