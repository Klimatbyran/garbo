import { z } from 'zod'
import { InitiativeCreateNestedManyWithoutCompanyInputObjectSchema } from './InitiativeCreateNestedManyWithoutCompanyInput.schema'
import { GoalCreateNestedManyWithoutCompanyInputObjectSchema } from './GoalCreateNestedManyWithoutCompanyInput.schema'
import { IndustryGicsCreateNestedOneWithoutCompaniesInputObjectSchema } from './IndustryGicsCreateNestedOneWithoutCompaniesInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyCreateWithoutFiscalYearsInput> = z
  .object({
    name: z.string(),
    description: z.string(),
    wikidataId: z.string().optional().nullable(),
    url: z.string(),
    initiatives: z
      .lazy(() => InitiativeCreateNestedManyWithoutCompanyInputObjectSchema)
      .optional(),
    goals: z
      .lazy(() => GoalCreateNestedManyWithoutCompanyInputObjectSchema)
      .optional(),
    industryGics: z
      .lazy(() => IndustryGicsCreateNestedOneWithoutCompaniesInputObjectSchema)
      .optional(),
  })
  .strict()

export const CompanyCreateWithoutFiscalYearsInputObjectSchema = Schema
