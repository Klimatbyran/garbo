import { z } from 'zod'
import { InitiativeUncheckedCreateNestedManyWithoutCompanyInputObjectSchema } from './InitiativeUncheckedCreateNestedManyWithoutCompanyInput.schema'
import { GoalUncheckedCreateNestedManyWithoutCompanyInputObjectSchema } from './GoalUncheckedCreateNestedManyWithoutCompanyInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyUncheckedCreateWithoutFiscalYearsInput> =
  z
    .object({
      id: z.number().optional(),
      name: z.string(),
      description: z.string(),
      wikidataId: z.string().optional().nullable(),
      url: z.string(),
      industryGicsId: z.number().optional().nullable(),
      initiatives: z
        .lazy(
          () =>
            InitiativeUncheckedCreateNestedManyWithoutCompanyInputObjectSchema
        )
        .optional(),
      goals: z
        .lazy(
          () => GoalUncheckedCreateNestedManyWithoutCompanyInputObjectSchema
        )
        .optional(),
    })
    .strict()

export const CompanyUncheckedCreateWithoutFiscalYearsInputObjectSchema = Schema
