import { z } from 'zod'
import { IntFilterObjectSchema } from './IntFilter.schema'
import { IntNullableFilterObjectSchema } from './IntNullableFilter.schema'
import { StringNullableFilterObjectSchema } from './StringNullableFilter.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.FiscalYearScalarWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => FiscalYearScalarWhereInputObjectSchema),
        z.lazy(() => FiscalYearScalarWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => FiscalYearScalarWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => FiscalYearScalarWhereInputObjectSchema),
        z.lazy(() => FiscalYearScalarWhereInputObjectSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterObjectSchema), z.number()]).optional(),
    startYear: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    endYear: z
      .union([z.lazy(() => IntNullableFilterObjectSchema), z.number()])
      .optional()
      .nullable(),
    startMonth: z
      .union([z.lazy(() => StringNullableFilterObjectSchema), z.string()])
      .optional()
      .nullable(),
    companyId: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    emissionsId: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
  })
  .strict()

export const FiscalYearScalarWhereInputObjectSchema = Schema
