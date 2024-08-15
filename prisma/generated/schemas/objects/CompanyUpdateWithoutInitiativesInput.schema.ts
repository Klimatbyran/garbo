import { z } from 'zod'
import { StringFieldUpdateOperationsInputObjectSchema } from './StringFieldUpdateOperationsInput.schema'
import { NullableStringFieldUpdateOperationsInputObjectSchema } from './NullableStringFieldUpdateOperationsInput.schema'
import { FiscalYearUpdateManyWithoutCompanyNestedInputObjectSchema } from './FiscalYearUpdateManyWithoutCompanyNestedInput.schema'
import { GoalUpdateManyWithoutCompanyNestedInputObjectSchema } from './GoalUpdateManyWithoutCompanyNestedInput.schema'
import { IndustryGicsUpdateOneWithoutCompaniesNestedInputObjectSchema } from './IndustryGicsUpdateOneWithoutCompaniesNestedInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyUpdateWithoutInitiativesInput> = z
  .object({
    name: z
      .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    description: z
      .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    wikidataId: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputObjectSchema),
      ])
      .optional()
      .nullable(),
    url: z
      .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    fiscalYears: z
      .lazy(() => FiscalYearUpdateManyWithoutCompanyNestedInputObjectSchema)
      .optional(),
    goals: z
      .lazy(() => GoalUpdateManyWithoutCompanyNestedInputObjectSchema)
      .optional(),
    industryGics: z
      .lazy(() => IndustryGicsUpdateOneWithoutCompaniesNestedInputObjectSchema)
      .optional(),
  })
  .strict()

export const CompanyUpdateWithoutInitiativesInputObjectSchema = Schema
