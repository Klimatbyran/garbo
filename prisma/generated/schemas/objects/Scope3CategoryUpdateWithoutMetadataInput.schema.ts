import { z } from 'zod'
import { IntFieldUpdateOperationsInputObjectSchema } from './IntFieldUpdateOperationsInput.schema'
import { NullableFloatFieldUpdateOperationsInputObjectSchema } from './NullableFloatFieldUpdateOperationsInput.schema'
import { Scope3UpdateOneRequiredWithoutCategoriesNestedInputObjectSchema } from './Scope3UpdateOneRequiredWithoutCategoriesNestedInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CategoryUpdateWithoutMetadataInput> = z
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
  })
  .strict()

export const Scope3CategoryUpdateWithoutMetadataInputObjectSchema = Schema
