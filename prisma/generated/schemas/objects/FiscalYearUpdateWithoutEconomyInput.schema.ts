import { z } from 'zod'
import { IntFieldUpdateOperationsInputObjectSchema } from './IntFieldUpdateOperationsInput.schema'
import { NullableIntFieldUpdateOperationsInputObjectSchema } from './NullableIntFieldUpdateOperationsInput.schema'
import { NullableStringFieldUpdateOperationsInputObjectSchema } from './NullableStringFieldUpdateOperationsInput.schema'
import { EmissionsUpdateOneWithoutFiscalYearNestedInputObjectSchema } from './EmissionsUpdateOneWithoutFiscalYearNestedInput.schema'
import { CompanyUpdateOneRequiredWithoutFiscalYearsNestedInputObjectSchema } from './CompanyUpdateOneRequiredWithoutFiscalYearsNestedInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.FiscalYearUpdateWithoutEconomyInput> = z
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
    emissions: z
      .lazy(() => EmissionsUpdateOneWithoutFiscalYearNestedInputObjectSchema)
      .optional(),
    company: z
      .lazy(
        () => CompanyUpdateOneRequiredWithoutFiscalYearsNestedInputObjectSchema
      )
      .optional(),
  })
  .strict()

export const FiscalYearUpdateWithoutEconomyInputObjectSchema = Schema
