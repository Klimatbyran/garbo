import { z } from 'zod'
import { NullableStringFieldUpdateOperationsInputObjectSchema } from './NullableStringFieldUpdateOperationsInput.schema'
import { IntFieldUpdateOperationsInputObjectSchema } from './IntFieldUpdateOperationsInput.schema'
import { DateTimeFieldUpdateOperationsInputObjectSchema } from './DateTimeFieldUpdateOperationsInput.schema'
import { GoalUpdateManyWithoutMetadataNestedInputObjectSchema } from './GoalUpdateManyWithoutMetadataNestedInput.schema'
import { InitiativeUpdateManyWithoutMetadataNestedInputObjectSchema } from './InitiativeUpdateManyWithoutMetadataNestedInput.schema'
import { EconomyUpdateManyWithoutMetadataNestedInputObjectSchema } from './EconomyUpdateManyWithoutMetadataNestedInput.schema'
import { Scope1UpdateManyWithoutMetadataNestedInputObjectSchema } from './Scope1UpdateManyWithoutMetadataNestedInput.schema'
import { Scope2UpdateManyWithoutMetadataNestedInputObjectSchema } from './Scope2UpdateManyWithoutMetadataNestedInput.schema'
import { Scope3UpdateManyWithoutMetadataNestedInputObjectSchema } from './Scope3UpdateManyWithoutMetadataNestedInput.schema'
import { Scope3CategoryUpdateManyWithoutMetadataNestedInputObjectSchema } from './Scope3CategoryUpdateManyWithoutMetadataNestedInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataUpdateInput> = z
  .object({
    url: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputObjectSchema),
      ])
      .optional()
      .nullable(),
    comment: z
      .union([
        z.string(),
        z.lazy(() => NullableStringFieldUpdateOperationsInputObjectSchema),
      ])
      .optional()
      .nullable(),
    userId: z
      .union([
        z.number(),
        z.lazy(() => IntFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    lastUpdated: z
      .union([
        z.coerce.date(),
        z.lazy(() => DateTimeFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
    goal: z
      .lazy(() => GoalUpdateManyWithoutMetadataNestedInputObjectSchema)
      .optional(),
    initiative: z
      .lazy(() => InitiativeUpdateManyWithoutMetadataNestedInputObjectSchema)
      .optional(),
    economy: z
      .lazy(() => EconomyUpdateManyWithoutMetadataNestedInputObjectSchema)
      .optional(),
    scope1: z
      .lazy(() => Scope1UpdateManyWithoutMetadataNestedInputObjectSchema)
      .optional(),
    scope2: z
      .lazy(() => Scope2UpdateManyWithoutMetadataNestedInputObjectSchema)
      .optional(),
    scope3: z
      .lazy(() => Scope3UpdateManyWithoutMetadataNestedInputObjectSchema)
      .optional(),
    scope3Category: z
      .lazy(
        () => Scope3CategoryUpdateManyWithoutMetadataNestedInputObjectSchema
      )
      .optional(),
  })
  .strict()

export const MetadataUpdateInputObjectSchema = Schema
