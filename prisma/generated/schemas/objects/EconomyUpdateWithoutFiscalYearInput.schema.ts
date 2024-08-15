import { z } from 'zod'
import { FloatFieldUpdateOperationsInputObjectSchema } from './FloatFieldUpdateOperationsInput.schema'
import { StringFieldUpdateOperationsInputObjectSchema } from './StringFieldUpdateOperationsInput.schema'
import { IntFieldUpdateOperationsInputObjectSchema } from './IntFieldUpdateOperationsInput.schema'
import { MetadataUpdateOneRequiredWithoutEconomyNestedInputObjectSchema } from './MetadataUpdateOneRequiredWithoutEconomyNestedInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EconomyUpdateWithoutFiscalYearInput> = z
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
    metadata: z
      .lazy(
        () => MetadataUpdateOneRequiredWithoutEconomyNestedInputObjectSchema
      )
      .optional(),
  })
  .strict()

export const EconomyUpdateWithoutFiscalYearInputObjectSchema = Schema
