import { z } from 'zod'
import { IntFieldUpdateOperationsInputObjectSchema } from './IntFieldUpdateOperationsInput.schema'
import { NullableIntFieldUpdateOperationsInputObjectSchema } from './NullableIntFieldUpdateOperationsInput.schema'
import { NullableStringFieldUpdateOperationsInputObjectSchema } from './NullableStringFieldUpdateOperationsInput.schema'
import { EconomyUpdateOneWithoutFiscalYearNestedInputObjectSchema } from './EconomyUpdateOneWithoutFiscalYearNestedInput.schema'
import { CompanyUpdateOneRequiredWithoutFiscalYearsNestedInputObjectSchema } from './CompanyUpdateOneRequiredWithoutFiscalYearsNestedInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.FiscalYearUpdateWithoutEmissionsInput> = z
  .object({
    startYear: z
      .union([
        z.number(),
        z.lazy(() => IntFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    endYear: z
      .union([
        z.number(),
        z.lazy(() => NullableIntFieldUpdateOperationsInputObjectSchema),
      ])
      .optional()
      .nullable(),
    startMonth: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputObjectSchema),
      ])
      .optional()
      .nullable(),
    emissionsId: z
      .union([
        z.number(),
        z.lazy(() => IntFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    economy: z
      .lazy(() => EconomyUpdateOneWithoutFiscalYearNestedInputObjectSchema)
      .optional(),
    company: z
      .lazy(
        () => CompanyUpdateOneRequiredWithoutFiscalYearsNestedInputObjectSchema
      )
      .optional(),
  })
  .strict()

export const FiscalYearUpdateWithoutEmissionsInputObjectSchema = Schema
