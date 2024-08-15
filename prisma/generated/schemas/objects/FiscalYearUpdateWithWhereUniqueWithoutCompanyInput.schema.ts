import { z } from 'zod'
import { FiscalYearWhereUniqueInputObjectSchema } from './FiscalYearWhereUniqueInput.schema'
import { FiscalYearUpdateWithoutCompanyInputObjectSchema } from './FiscalYearUpdateWithoutCompanyInput.schema'
import { FiscalYearUncheckedUpdateWithoutCompanyInputObjectSchema } from './FiscalYearUncheckedUpdateWithoutCompanyInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.FiscalYearUpdateWithWhereUniqueWithoutCompanyInput> =
  z
    .object({
      where: z.lazy(() => FiscalYearWhereUniqueInputObjectSchema),
      data: z.union([
        z.lazy(() => FiscalYearUpdateWithoutCompanyInputObjectSchema),
        z.lazy(() => FiscalYearUncheckedUpdateWithoutCompanyInputObjectSchema),
      ]),
    })
    .strict()

export const FiscalYearUpdateWithWhereUniqueWithoutCompanyInputObjectSchema =
  Schema
