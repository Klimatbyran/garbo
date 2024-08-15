import { z } from 'zod'
import { FloatFieldUpdateOperationsInputObjectSchema } from './FloatFieldUpdateOperationsInput.schema'
import { StringFieldUpdateOperationsInputObjectSchema } from './StringFieldUpdateOperationsInput.schema'
import { IntFieldUpdateOperationsInputObjectSchema } from './IntFieldUpdateOperationsInput.schema'
import { FiscalYearUpdateOneRequiredWithoutEconomyNestedInputObjectSchema } from './FiscalYearUpdateOneRequiredWithoutEconomyNestedInput.schema'
import { MetadataUpdateOneRequiredWithoutEconomyNestedInputObjectSchema } from './MetadataUpdateOneRequiredWithoutEconomyNestedInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EconomyUpdateInput> = z
  .object({
    turnover: z
      .union([
        z.number(),
        z.lazy(() => FloatFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    unit: z
      .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    employees: z
      .union([
        z.number(),
        z.lazy(() => IntFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    fiscalYear: z
      .lazy(
        () => FiscalYearUpdateOneRequiredWithoutEconomyNestedInputObjectSchema
      )
      .optional(),
    metadata: z
      .lazy(
        () => MetadataUpdateOneRequiredWithoutEconomyNestedInputObjectSchema
      )
      .optional(),
  })
  .strict()

export const EconomyUpdateInputObjectSchema = Schema
