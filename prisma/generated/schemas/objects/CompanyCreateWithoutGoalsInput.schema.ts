import { z } from 'zod'
import { FiscalYearCreateNestedManyWithoutCompanyInputObjectSchema } from './FiscalYearCreateNestedManyWithoutCompanyInput.schema'
import { InitiativeCreateNestedManyWithoutCompanyInputObjectSchema } from './InitiativeCreateNestedManyWithoutCompanyInput.schema'
import { IndustryGicsCreateNestedOneWithoutCompaniesInputObjectSchema } from './IndustryGicsCreateNestedOneWithoutCompaniesInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyCreateWithoutGoalsInput> = z
  .object({
    name: z.string(),
    description: z.string(),
    wikidataId: z.string().optional().nullable(),
    url: z.string(),
    fiscalYears: z
      .lazy(() => FiscalYearCreateNestedManyWithoutCompanyInputObjectSchema)
      .optional(),
    initiatives: z
      .lazy(() => InitiativeCreateNestedManyWithoutCompanyInputObjectSchema)
      .optional(),
    industryGics: z
      .lazy(() => IndustryGicsCreateNestedOneWithoutCompaniesInputObjectSchema)
      .optional(),
  })
  .strict()

export const CompanyCreateWithoutGoalsInputObjectSchema = Schema
