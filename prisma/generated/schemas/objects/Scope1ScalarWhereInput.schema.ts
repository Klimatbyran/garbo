import { z } from 'zod'
import { IntFilterObjectSchema } from './IntFilter.schema'
import { FloatFilterObjectSchema } from './FloatFilter.schema'
import { FloatNullableFilterObjectSchema } from './FloatNullableFilter.schema'
import { StringFilterObjectSchema } from './StringFilter.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope1ScalarWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => Scope1ScalarWhereInputObjectSchema),
        z.lazy(() => Scope1ScalarWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => Scope1ScalarWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => Scope1ScalarWhereInputObjectSchema),
        z.lazy(() => Scope1ScalarWhereInputObjectSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterObjectSchema), z.number()]).optional(),
    value: z
      .union([z.lazy(() => FloatFilterObjectSchema), z.number()])
      .optional(),
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
  })
  .strict()

export const Scope1ScalarWhereInputObjectSchema = Schema
