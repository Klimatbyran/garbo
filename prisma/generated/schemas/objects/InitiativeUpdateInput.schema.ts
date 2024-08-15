import { z } from 'zod'
import { StringFieldUpdateOperationsInputObjectSchema } from './StringFieldUpdateOperationsInput.schema'
import { NullableStringFieldUpdateOperationsInputObjectSchema } from './NullableStringFieldUpdateOperationsInput.schema'
import { CompanyUpdateOneRequiredWithoutInitiativesNestedInputObjectSchema } from './CompanyUpdateOneRequiredWithoutInitiativesNestedInput.schema'
import { MetadataUpdateOneRequiredWithoutInitiativeNestedInputObjectSchema } from './MetadataUpdateOneRequiredWithoutInitiativeNestedInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.InitiativeUpdateInput> = z
  .object({
    title: z
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
    year: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputObjectSchema),
      ])
      .optional()
      .nullable(),
    scope: z
      .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    company: z
      .lazy(
        () => CompanyUpdateOneRequiredWithoutInitiativesNestedInputObjectSchema
      )
      .optional(),
    metadata: z
      .lazy(
        () => MetadataUpdateOneRequiredWithoutInitiativeNestedInputObjectSchema
      )
      .optional(),
  })
  .strict()

export const InitiativeUpdateInputObjectSchema = Schema
