import { z } from 'zod'
import { IntFieldUpdateOperationsInputObjectSchema } from './IntFieldUpdateOperationsInput.schema'
import { NullableFloatFieldUpdateOperationsInputObjectSchema } from './NullableFloatFieldUpdateOperationsInput.schema'
import { Scope3UpdateOneRequiredWithoutCategoriesNestedInputObjectSchema } from './Scope3UpdateOneRequiredWithoutCategoriesNestedInput.schema'
import { MetadataUpdateOneRequiredWithoutScope3CategoryNestedInputObjectSchema } from './MetadataUpdateOneRequiredWithoutScope3CategoryNestedInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CategoryUpdateInput> = z
  .object({
    category: z
      .union([
        z.number(),
        z.lazy(() => IntFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    value: z
      .union([
        z.number(),
        z.lazy(() => NullableFloatFieldUpdateOperationsInputObjectSchema),
      ])
      .optional()
      .nullable(),
    scope3: z
      .lazy(
        () => Scope3UpdateOneRequiredWithoutCategoriesNestedInputObjectSchema
      )
      .optional(),
    metadata: z
      .lazy(
        () =>
          MetadataUpdateOneRequiredWithoutScope3CategoryNestedInputObjectSchema
      )
      .optional(),
  })
  .strict()

export const Scope3CategoryUpdateInputObjectSchema = Schema
