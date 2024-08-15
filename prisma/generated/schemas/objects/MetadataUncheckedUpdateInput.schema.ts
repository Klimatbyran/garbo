import { z } from 'zod'
import { IntFieldUpdateOperationsInputObjectSchema } from './IntFieldUpdateOperationsInput.schema'
import { NullableStringFieldUpdateOperationsInputObjectSchema } from './NullableStringFieldUpdateOperationsInput.schema'
import { DateTimeFieldUpdateOperationsInputObjectSchema } from './DateTimeFieldUpdateOperationsInput.schema'
import { GoalUncheckedUpdateManyWithoutMetadataNestedInputObjectSchema } from './GoalUncheckedUpdateManyWithoutMetadataNestedInput.schema'
import { InitiativeUncheckedUpdateManyWithoutMetadataNestedInputObjectSchema } from './InitiativeUncheckedUpdateManyWithoutMetadataNestedInput.schema'
import { EconomyUncheckedUpdateManyWithoutMetadataNestedInputObjectSchema } from './EconomyUncheckedUpdateManyWithoutMetadataNestedInput.schema'
import { Scope1UncheckedUpdateManyWithoutMetadataNestedInputObjectSchema } from './Scope1UncheckedUpdateManyWithoutMetadataNestedInput.schema'
import { Scope2UncheckedUpdateManyWithoutMetadataNestedInputObjectSchema } from './Scope2UncheckedUpdateManyWithoutMetadataNestedInput.schema'
import { Scope3UncheckedUpdateManyWithoutMetadataNestedInputObjectSchema } from './Scope3UncheckedUpdateManyWithoutMetadataNestedInput.schema'
import { Scope3CategoryUncheckedUpdateManyWithoutMetadataNestedInputObjectSchema } from './Scope3CategoryUncheckedUpdateManyWithoutMetadataNestedInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataUncheckedUpdateInput> = z
  .object({
    id: z
      .union([
        z.number(),
        z.lazy(() => IntFieldUpdateOperationsInputObjectSchema),
      ])
      .optional(),
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
      .lazy(() => GoalUncheckedUpdateManyWithoutMetadataNestedInputObjectSchema)
      .optional(),
    initiative: z
      .lazy(
        () =>
          InitiativeUncheckedUpdateManyWithoutMetadataNestedInputObjectSchema
      )
      .optional(),
    economy: z
      .lazy(
        () => EconomyUncheckedUpdateManyWithoutMetadataNestedInputObjectSchema
      )
      .optional(),
    scope1: z
      .lazy(
        () => Scope1UncheckedUpdateManyWithoutMetadataNestedInputObjectSchema
      )
      .optional(),
    scope2: z
      .lazy(
        () => Scope2UncheckedUpdateManyWithoutMetadataNestedInputObjectSchema
      )
      .optional(),
    scope3: z
      .lazy(
        () => Scope3UncheckedUpdateManyWithoutMetadataNestedInputObjectSchema
      )
      .optional(),
    scope3Category: z
      .lazy(
        () =>
          Scope3CategoryUncheckedUpdateManyWithoutMetadataNestedInputObjectSchema
      )
      .optional(),
  })
  .strict()

export const MetadataUncheckedUpdateInputObjectSchema = Schema
