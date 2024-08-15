import { z } from 'zod'
import { FiscalYearScalarWhereInputObjectSchema } from './FiscalYearScalarWhereInput.schema'
import { FiscalYearUpdateManyMutationInputObjectSchema } from './FiscalYearUpdateManyMutationInput.schema'
import { FiscalYearUncheckedUpdateManyWithoutFiscalYearsInputObjectSchema } from './FiscalYearUncheckedUpdateManyWithoutFiscalYearsInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.FiscalYearUpdateManyWithWhereWithoutCompanyInput> =
  z
    .object({
      where: z.lazy(() => FiscalYearScalarWhereInputObjectSchema),
      data: z.union([
        z.lazy(() => FiscalYearUpdateManyMutationInputObjectSchema),
        z.lazy(
          () => FiscalYearUncheckedUpdateManyWithoutFiscalYearsInputObjectSchema
        ),
      ]),
    })
    .strict()

export const FiscalYearUpdateManyWithWhereWithoutCompanyInputObjectSchema =
  Schema
