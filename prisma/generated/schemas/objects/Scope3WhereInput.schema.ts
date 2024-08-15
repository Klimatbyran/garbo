import { z } from 'zod'
import { IntFilterObjectSchema } from './IntFilter.schema'
import { FloatNullableFilterObjectSchema } from './FloatNullableFilter.schema'
import { StringFilterObjectSchema } from './StringFilter.schema'
import { EmissionsRelationFilterObjectSchema } from './EmissionsRelationFilter.schema'
import { EmissionsWhereInputObjectSchema } from './EmissionsWhereInput.schema'
import { Scope3CategoryListRelationFilterObjectSchema } from './Scope3CategoryListRelationFilter.schema'
import { MetadataRelationFilterObjectSchema } from './MetadataRelationFilter.schema'
import { MetadataWhereInputObjectSchema } from './MetadataWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3WhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => Scope3WhereInputObjectSchema),
        z.lazy(() => Scope3WhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => Scope3WhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => Scope3WhereInputObjectSchema),
        z.lazy(() => Scope3WhereInputObjectSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterObjectSchema), z.number()]).optional(),
    value: z
      .union([z.lazy(() => FloatNullableFilterObjectSchema), z.number()])
      .optional()
      .nullable(),
    biogenic: z
      .union([z.lazy(() => FloatNullableFilterObjectSchema), z.number()])
      .optional()
      .nullable(),
    unit: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    baseYear: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    metadataId: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    emissionsId: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    emissions: z
      .union([
        z.lazy(() => EmissionsRelationFilterObjectSchema),
        z.lazy(() => EmissionsWhereInputObjectSchema),
      ])
      .optional(),
    categories: z
      .lazy(() => Scope3CategoryListRelationFilterObjectSchema)
      .optional(),
    metadata: z
      .union([
        z.lazy(() => MetadataRelationFilterObjectSchema),
        z.lazy(() => MetadataWhereInputObjectSchema),
      ])
      .optional(),
  })
  .strict()

export const Scope3WhereInputObjectSchema = Schema
