import { z } from 'zod'
import { FiscalYearWhereUniqueInputObjectSchema } from './FiscalYearWhereUniqueInput.schema'
import { FiscalYearUpdateWithoutCompanyInputObjectSchema } from './FiscalYearUpdateWithoutCompanyInput.schema'
import { FiscalYearUncheckedUpdateWithoutCompanyInputObjectSchema } from './FiscalYearUncheckedUpdateWithoutCompanyInput.schema'
import { FiscalYearCreateWithoutCompanyInputObjectSchema } from './FiscalYearCreateWithoutCompanyInput.schema'
import { FiscalYearUncheckedCreateWithoutCompanyInputObjectSchema } from './FiscalYearUncheckedCreateWithoutCompanyInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.FiscalYearUpsertWithWhereUniqueWithoutCompanyInput> =
  z
    .object({
      where: z.lazy(() => FiscalYearWhereUniqueInputObjectSchema),
      update: z.union([
        z.lazy(() => FiscalYearUpdateWithoutCompanyInputObjectSchema),
        z.lazy(() => FiscalYearUncheckedUpdateWithoutCompanyInputObjectSchema),
      ]),
      create: z.union([
        z.lazy(() => FiscalYearCreateWithoutCompanyInputObjectSchema),
        z.lazy(() => FiscalYearUncheckedCreateWithoutCompanyInputObjectSchema),
      ]),
    })
    .strict()

export const FiscalYearUpsertWithWhereUniqueWithoutCompanyInputObjectSchema =
  Schema
