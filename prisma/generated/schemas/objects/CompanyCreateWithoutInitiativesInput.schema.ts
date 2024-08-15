import { z } from 'zod'
import { FiscalYearCreateNestedManyWithoutCompanyInputObjectSchema } from './FiscalYearCreateNestedManyWithoutCompanyInput.schema'
import { GoalCreateNestedManyWithoutCompanyInputObjectSchema } from './GoalCreateNestedManyWithoutCompanyInput.schema'
import { IndustryGicsCreateNestedOneWithoutCompaniesInputObjectSchema } from './IndustryGicsCreateNestedOneWithoutCompaniesInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyCreateWithoutInitiativesInput> = z
  .object({
    name: z.string(),
    description: z.string(),
    wikidataId: z.string().optional().nullable(),
    url: z.string(),
    fiscalYears: z
      .lazy(() => FiscalYearCreateNestedManyWithoutCompanyInputObjectSchema)
      .optional(),
    goals: z
      .lazy(() => GoalCreateNestedManyWithoutCompanyInputObjectSchema)
      .optional(),
    industryGics: z
      .lazy(() => IndustryGicsCreateNestedOneWithoutCompaniesInputObjectSchema)
      .optional(),
  })
  .strict()

export const CompanyCreateWithoutInitiativesInputObjectSchema = Schema
