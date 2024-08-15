import { z } from 'zod'
import { IntFieldUpdateOperationsInputObjectSchema } from './IntFieldUpdateOperationsInput.schema'
import { Scope1UpdateOneWithoutEmissionsNestedInputObjectSchema } from './Scope1UpdateOneWithoutEmissionsNestedInput.schema'
import { Scope2UpdateOneWithoutEmissionsNestedInputObjectSchema } from './Scope2UpdateOneWithoutEmissionsNestedInput.schema'
import { Scope3UpdateOneWithoutEmissionsNestedInputObjectSchema } from './Scope3UpdateOneWithoutEmissionsNestedInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EmissionsUpdateWithoutFiscalYearInput> = z
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
    scope1: z
      .lazy(() => Scope1UpdateOneWithoutEmissionsNestedInputObjectSchema)
      .optional(),
    scope2: z
      .lazy(() => Scope2UpdateOneWithoutEmissionsNestedInputObjectSchema)
      .optional(),
    scope3: z
      .lazy(() => Scope3UpdateOneWithoutEmissionsNestedInputObjectSchema)
      .optional(),
  })
  .strict()

export const EmissionsUpdateWithoutFiscalYearInputObjectSchema = Schema
