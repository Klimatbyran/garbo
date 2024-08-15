import { z } from 'zod'
import { IntFilterObjectSchema } from './IntFilter.schema'
import { FloatFilterObjectSchema } from './FloatFilter.schema'
import { StringFilterObjectSchema } from './StringFilter.schema'
import { FiscalYearRelationFilterObjectSchema } from './FiscalYearRelationFilter.schema'
import { FiscalYearWhereInputObjectSchema } from './FiscalYearWhereInput.schema'
import { MetadataRelationFilterObjectSchema } from './MetadataRelationFilter.schema'
import { MetadataWhereInputObjectSchema } from './MetadataWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EconomyWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => EconomyWhereInputObjectSchema),
        z.lazy(() => EconomyWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => EconomyWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => EconomyWhereInputObjectSchema),
        z.lazy(() => EconomyWhereInputObjectSchema).array(),
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
    fiscalYear: z
      .union([
        z.lazy(() => FiscalYearRelationFilterObjectSchema),
        z.lazy(() => FiscalYearWhereInputObjectSchema),
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

export const EconomyWhereInputObjectSchema = Schema
