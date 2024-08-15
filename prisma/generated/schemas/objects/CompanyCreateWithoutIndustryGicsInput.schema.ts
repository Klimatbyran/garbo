import { z } from 'zod'
import { FiscalYearCreateNestedManyWithoutCompanyInputObjectSchema } from './FiscalYearCreateNestedManyWithoutCompanyInput.schema'
import { InitiativeCreateNestedManyWithoutCompanyInputObjectSchema } from './InitiativeCreateNestedManyWithoutCompanyInput.schema'
import { GoalCreateNestedManyWithoutCompanyInputObjectSchema } from './GoalCreateNestedManyWithoutCompanyInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyCreateWithoutIndustryGicsInput> = z
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
    goals: z
      .lazy(() => GoalCreateNestedManyWithoutCompanyInputObjectSchema)
      .optional(),
  })
  .strict()

export const CompanyCreateWithoutIndustryGicsInputObjectSchema = Schema
