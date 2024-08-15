import { z } from 'zod'
import { IntFilterObjectSchema } from './IntFilter.schema'
import { FloatFilterObjectSchema } from './FloatFilter.schema'
import { FloatNullableFilterObjectSchema } from './FloatNullableFilter.schema'
import { StringFilterObjectSchema } from './StringFilter.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope2ScalarWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => Scope2ScalarWhereInputObjectSchema),
        z.lazy(() => Scope2ScalarWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => Scope2ScalarWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => Scope2ScalarWhereInputObjectSchema),
        z.lazy(() => Scope2ScalarWhereInputObjectSchema).array(),
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
    mb: z
      .union([z.lazy(() => FloatNullableFilterObjectSchema), z.number()])
      .optional()
      .nullable(),
    lb: z
      .union([z.lazy(() => FloatNullableFilterObjectSchema), z.number()])
      .optional()
      .nullable(),
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

export const Scope2ScalarWhereInputObjectSchema = Schema
