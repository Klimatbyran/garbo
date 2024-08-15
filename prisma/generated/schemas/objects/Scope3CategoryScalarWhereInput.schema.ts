import { z } from 'zod'
import { IntFilterObjectSchema } from './IntFilter.schema'
import { FloatNullableFilterObjectSchema } from './FloatNullableFilter.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CategoryScalarWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => Scope3CategoryScalarWhereInputObjectSchema),
        z.lazy(() => Scope3CategoryScalarWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => Scope3CategoryScalarWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => Scope3CategoryScalarWhereInputObjectSchema),
        z.lazy(() => Scope3CategoryScalarWhereInputObjectSchema).array(),
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
  })
  .strict()

export const Scope3CategoryScalarWhereInputObjectSchema = Schema
