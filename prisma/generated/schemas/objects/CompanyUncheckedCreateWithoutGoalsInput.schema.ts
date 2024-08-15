import { z } from 'zod'
import { FiscalYearUncheckedCreateNestedManyWithoutCompanyInputObjectSchema } from './FiscalYearUncheckedCreateNestedManyWithoutCompanyInput.schema'
import { InitiativeUncheckedCreateNestedManyWithoutCompanyInputObjectSchema } from './InitiativeUncheckedCreateNestedManyWithoutCompanyInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyUncheckedCreateWithoutGoalsInput> = z
  .object({
    id: z.number().optional(),
    name: z.string(),
    description: z.string(),
    wikidataId: z.string().optional().nullable(),
    url: z.string(),
    industryGicsId: z.number().optional().nullable(),
    fiscalYears: z
      .lazy(
        () => FiscalYearUncheckedCreateNestedManyWithoutCompanyInputObjectSchema
      )
      .optional(),
    initiatives: z
      .lazy(
        () => InitiativeUncheckedCreateNestedManyWithoutCompanyInputObjectSchema
      )
      .optional(),
  })
  .strict()

export const CompanyUncheckedCreateWithoutGoalsInputObjectSchema = Schema
