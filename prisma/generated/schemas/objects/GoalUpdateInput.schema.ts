import { z } from 'zod'
import { StringFieldUpdateOperationsInputObjectSchema } from './StringFieldUpdateOperationsInput.schema'
import { NullableStringFieldUpdateOperationsInputObjectSchema } from './NullableStringFieldUpdateOperationsInput.schema'
import { NullableFloatFieldUpdateOperationsInputObjectSchema } from './NullableFloatFieldUpdateOperationsInput.schema'
import { MetadataUpdateOneRequiredWithoutGoalNestedInputObjectSchema } from './MetadataUpdateOneRequiredWithoutGoalNestedInput.schema'
import { CompanyUpdateOneRequiredWithoutGoalsNestedInputObjectSchema } from './CompanyUpdateOneRequiredWithoutGoalsNestedInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.GoalUpdateInput> = z
  .object({
    description: z
      .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    year: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputObjectSchema),
      ])
      .optional()
      .nullable(),
    target: z
      .union([
        z.number(),
        z.lazy(() => NullableFloatFieldUpdateOperationsInputObjectSchema),
      ])
      .optional()
      .nullable(),
    baseYear: z
      .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    metadata: z
      .lazy(() => MetadataUpdateOneRequiredWithoutGoalNestedInputObjectSchema)
      .optional(),
    company: z
      .lazy(() => CompanyUpdateOneRequiredWithoutGoalsNestedInputObjectSchema)
      .optional(),
  })
  .strict()

export const GoalUpdateInputObjectSchema = Schema
