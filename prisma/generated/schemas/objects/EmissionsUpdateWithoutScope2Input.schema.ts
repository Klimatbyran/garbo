import { z } from 'zod'
import { IntFieldUpdateOperationsInputObjectSchema } from './IntFieldUpdateOperationsInput.schema'
import { FiscalYearUpdateOneRequiredWithoutEmissionsNestedInputObjectSchema } from './FiscalYearUpdateOneRequiredWithoutEmissionsNestedInput.schema'
import { Scope1UpdateOneWithoutEmissionsNestedInputObjectSchema } from './Scope1UpdateOneWithoutEmissionsNestedInput.schema'
import { Scope3UpdateOneWithoutEmissionsNestedInputObjectSchema } from './Scope3UpdateOneWithoutEmissionsNestedInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EmissionsUpdateWithoutScope2Input> = z
  .object({
    scope1Id: z
      .union([
        z.number(),
        z.lazy(() => IntFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    scope2Id: z
      .union([
        z.number(),
        z.lazy(() => IntFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    scope3Id: z
      .union([
        z.number(),
        z.lazy(() => IntFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    fiscalYear: z
      .lazy(
        () => FiscalYearUpdateOneRequiredWithoutEmissionsNestedInputObjectSchema
      )
      .optional(),
    scope1: z
      .lazy(() => Scope1UpdateOneWithoutEmissionsNestedInputObjectSchema)
      .optional(),
    scope3: z
      .lazy(() => Scope3UpdateOneWithoutEmissionsNestedInputObjectSchema)
      .optional(),
  })
  .strict()

export const EmissionsUpdateWithoutScope2InputObjectSchema = Schema
