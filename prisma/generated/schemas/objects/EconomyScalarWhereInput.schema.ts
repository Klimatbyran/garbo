import { z } from 'zod'
import { IntFilterObjectSchema } from './IntFilter.schema'
import { FloatFilterObjectSchema } from './FloatFilter.schema'
import { StringFilterObjectSchema } from './StringFilter.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EconomyScalarWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => EconomyScalarWhereInputObjectSchema),
        z.lazy(() => EconomyScalarWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => EconomyScalarWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => EconomyScalarWhereInputObjectSchema),
        z.lazy(() => EconomyScalarWhereInputObjectSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterObjectSchema), z.number()]).optional(),
    turnover: z
      .union([z.lazy(() => FloatFilterObjectSchema), z.number()])
      .optional(),
    unit: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    employees: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    metadataId: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    fiscalYearId: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
  })
  .strict()

export const EconomyScalarWhereInputObjectSchema = Schema
