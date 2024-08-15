import { z } from 'zod'
import { IntFilterObjectSchema } from './IntFilter.schema'
import { IntNullableFilterObjectSchema } from './IntNullableFilter.schema'
import { StringNullableFilterObjectSchema } from './StringNullableFilter.schema'
import { EconomyRelationFilterObjectSchema } from './EconomyRelationFilter.schema'
import { EconomyWhereInputObjectSchema } from './EconomyWhereInput.schema'
import { EmissionsRelationFilterObjectSchema } from './EmissionsRelationFilter.schema'
import { EmissionsWhereInputObjectSchema } from './EmissionsWhereInput.schema'
import { CompanyRelationFilterObjectSchema } from './CompanyRelationFilter.schema'
import { CompanyWhereInputObjectSchema } from './CompanyWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.FiscalYearWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => FiscalYearWhereInputObjectSchema),
        z.lazy(() => FiscalYearWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => FiscalYearWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => FiscalYearWhereInputObjectSchema),
        z.lazy(() => FiscalYearWhereInputObjectSchema).array(),
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
    economy: z
      .union([
        z.lazy(() => EconomyRelationFilterObjectSchema),
        z.lazy(() => EconomyWhereInputObjectSchema),
      ])
      .optional()
      .nullable(),
    emissions: z
      .union([
        z.lazy(() => EmissionsRelationFilterObjectSchema),
        z.lazy(() => EmissionsWhereInputObjectSchema),
      ])
      .optional()
      .nullable(),
    company: z
      .union([
        z.lazy(() => CompanyRelationFilterObjectSchema),
        z.lazy(() => CompanyWhereInputObjectSchema),
      ])
      .optional(),
  })
  .strict()

export const FiscalYearWhereInputObjectSchema = Schema
