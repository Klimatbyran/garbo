import { z } from 'zod'
import { FloatFieldUpdateOperationsInputObjectSchema } from './FloatFieldUpdateOperationsInput.schema'
import { NullableFloatFieldUpdateOperationsInputObjectSchema } from './NullableFloatFieldUpdateOperationsInput.schema'
import { StringFieldUpdateOperationsInputObjectSchema } from './StringFieldUpdateOperationsInput.schema'
import { EmissionsUpdateOneRequiredWithoutScope1NestedInputObjectSchema } from './EmissionsUpdateOneRequiredWithoutScope1NestedInput.schema'
import { MetadataUpdateOneRequiredWithoutScope1NestedInputObjectSchema } from './MetadataUpdateOneRequiredWithoutScope1NestedInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope1UpdateInput> = z
  .object({
    value: z
      .union([
        z.number(),
        z.lazy(() => FloatFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
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
        () => EmissionsUpdateOneRequiredWithoutScope1NestedInputObjectSchema
      )
      .optional(),
    metadata: z
      .lazy(() => MetadataUpdateOneRequiredWithoutScope1NestedInputObjectSchema)
      .optional(),
  })
  .strict()

export const Scope1UpdateInputObjectSchema = Schema
