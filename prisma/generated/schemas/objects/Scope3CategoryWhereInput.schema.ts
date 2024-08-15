import { z } from 'zod'
import { IntFilterObjectSchema } from './IntFilter.schema'
import { FloatNullableFilterObjectSchema } from './FloatNullableFilter.schema'
import { Scope3RelationFilterObjectSchema } from './Scope3RelationFilter.schema'
import { Scope3WhereInputObjectSchema } from './Scope3WhereInput.schema'
import { MetadataRelationFilterObjectSchema } from './MetadataRelationFilter.schema'
import { MetadataWhereInputObjectSchema } from './MetadataWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CategoryWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => Scope3CategoryWhereInputObjectSchema),
        z.lazy(() => Scope3CategoryWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => Scope3CategoryWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => Scope3CategoryWhereInputObjectSchema),
        z.lazy(() => Scope3CategoryWhereInputObjectSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterObjectSchema), z.number()]).optional(),
    category: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    value: z
      .union([z.lazy(() => FloatNullableFilterObjectSchema), z.number()])
      .optional()
      .nullable(),
    scope3Id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    metadataId: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    scope3: z
      .union([
        z.lazy(() => Scope3RelationFilterObjectSchema),
        z.lazy(() => Scope3WhereInputObjectSchema),
      ])
      .optional(),
    metadata: z
      .union([
        z.lazy(() => MetadataRelationFilterObjectSchema),
        z.lazy(() => MetadataWhereInputObjectSchema),
      ])
      .optional(),
  })
  .strict()

export const Scope3CategoryWhereInputObjectSchema = Schema
