import { z } from 'zod'
import { IntFilterObjectSchema } from './IntFilter.schema'
import { FiscalYearRelationFilterObjectSchema } from './FiscalYearRelationFilter.schema'
import { FiscalYearWhereInputObjectSchema } from './FiscalYearWhereInput.schema'
import { Scope1RelationFilterObjectSchema } from './Scope1RelationFilter.schema'
import { Scope1WhereInputObjectSchema } from './Scope1WhereInput.schema'
import { Scope2RelationFilterObjectSchema } from './Scope2RelationFilter.schema'
import { Scope2WhereInputObjectSchema } from './Scope2WhereInput.schema'
import { Scope3RelationFilterObjectSchema } from './Scope3RelationFilter.schema'
import { Scope3WhereInputObjectSchema } from './Scope3WhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EmissionsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => EmissionsWhereInputObjectSchema),
        z.lazy(() => EmissionsWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => EmissionsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => EmissionsWhereInputObjectSchema),
        z.lazy(() => EmissionsWhereInputObjectSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterObjectSchema), z.number()]).optional(),
    fiscalYearId: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    scope1Id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    scope2Id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    scope3Id: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    fiscalYear: z
      .union([
        z.lazy(() => FiscalYearRelationFilterObjectSchema),
        z.lazy(() => FiscalYearWhereInputObjectSchema),
      ])
      .optional(),
    scope1: z
      .union([
        z.lazy(() => Scope1RelationFilterObjectSchema),
        z.lazy(() => Scope1WhereInputObjectSchema),
      ])
      .optional()
      .nullable(),
    scope2: z
      .union([
        z.lazy(() => Scope2RelationFilterObjectSchema),
        z.lazy(() => Scope2WhereInputObjectSchema),
      ])
      .optional()
      .nullable(),
    scope3: z
      .union([
        z.lazy(() => Scope3RelationFilterObjectSchema),
        z.lazy(() => Scope3WhereInputObjectSchema),
      ])
      .optional()
      .nullable(),
  })
  .strict()

export const EmissionsWhereInputObjectSchema = Schema
