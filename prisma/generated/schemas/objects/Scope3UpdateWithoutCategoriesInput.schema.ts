import { z } from 'zod'
import { NullableFloatFieldUpdateOperationsInputObjectSchema } from './NullableFloatFieldUpdateOperationsInput.schema'
import { StringFieldUpdateOperationsInputObjectSchema } from './StringFieldUpdateOperationsInput.schema'
import { EmissionsUpdateOneRequiredWithoutScope3NestedInputObjectSchema } from './EmissionsUpdateOneRequiredWithoutScope3NestedInput.schema'
import { MetadataUpdateOneRequiredWithoutScope3NestedInputObjectSchema } from './MetadataUpdateOneRequiredWithoutScope3NestedInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3UpdateWithoutCategoriesInput> = z
  .object({
    value: z
      .union([
        z.number(),
        z.lazy(() => NullableFloatFieldUpdateOperationsInputObjectSchema),
      ])
      .optional()
      .nullable(),
    biogenic: z
      .union([
        z.number(),
        z.lazy(() => NullableFloatFieldUpdateOperationsInputObjectSchema),
      ])
      .optional()
      .nullable(),
    unit: z
      .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    baseYear: z
      .union([
        z.string(),
        z.lazy(() => StringFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    emissions: z
      .lazy(
        () => EmissionsUpdateOneRequiredWithoutScope3NestedInputObjectSchema
      )
      .optional(),
    metadata: z
      .lazy(() => MetadataUpdateOneRequiredWithoutScope3NestedInputObjectSchema)
      .optional(),
  })
  .strict()

export const Scope3UpdateWithoutCategoriesInputObjectSchema = Schema
