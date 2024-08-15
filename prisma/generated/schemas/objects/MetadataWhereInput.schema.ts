import { z } from 'zod'
import { IntFilterObjectSchema } from './IntFilter.schema'
import { StringNullableFilterObjectSchema } from './StringNullableFilter.schema'
import { DateTimeFilterObjectSchema } from './DateTimeFilter.schema'
import { GoalListRelationFilterObjectSchema } from './GoalListRelationFilter.schema'
import { InitiativeListRelationFilterObjectSchema } from './InitiativeListRelationFilter.schema'
import { EconomyListRelationFilterObjectSchema } from './EconomyListRelationFilter.schema'
import { Scope1ListRelationFilterObjectSchema } from './Scope1ListRelationFilter.schema'
import { Scope2ListRelationFilterObjectSchema } from './Scope2ListRelationFilter.schema'
import { Scope3ListRelationFilterObjectSchema } from './Scope3ListRelationFilter.schema'
import { Scope3CategoryListRelationFilterObjectSchema } from './Scope3CategoryListRelationFilter.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.MetadataWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => MetadataWhereInputObjectSchema),
        z.lazy(() => MetadataWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => MetadataWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => MetadataWhereInputObjectSchema),
        z.lazy(() => MetadataWhereInputObjectSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterObjectSchema), z.number()]).optional(),
    url: z
      .union([z.lazy(() => StringNullableFilterObjectSchema), z.string()])
      .optional()
      .nullable(),
    comment: z
      .union([z.lazy(() => StringNullableFilterObjectSchema), z.string()])
      .optional()
      .nullable(),
    userId: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    lastUpdated: z
      .union([z.lazy(() => DateTimeFilterObjectSchema), z.coerce.date()])
      .optional(),
    goal: z.lazy(() => GoalListRelationFilterObjectSchema).optional(),
    initiative: z
      .lazy(() => InitiativeListRelationFilterObjectSchema)
      .optional(),
    economy: z.lazy(() => EconomyListRelationFilterObjectSchema).optional(),
    scope1: z.lazy(() => Scope1ListRelationFilterObjectSchema).optional(),
    scope2: z.lazy(() => Scope2ListRelationFilterObjectSchema).optional(),
    scope3: z.lazy(() => Scope3ListRelationFilterObjectSchema).optional(),
    scope3Category: z
      .lazy(() => Scope3CategoryListRelationFilterObjectSchema)
      .optional(),
  })
  .strict()

export const MetadataWhereInputObjectSchema = Schema
