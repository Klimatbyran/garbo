import { z } from 'zod'
import { IntFilterObjectSchema } from './IntFilter.schema'
import { StringFilterObjectSchema } from './StringFilter.schema'
import { StringNullableFilterObjectSchema } from './StringNullableFilter.schema'
import { IntNullableFilterObjectSchema } from './IntNullableFilter.schema'
import { FiscalYearListRelationFilterObjectSchema } from './FiscalYearListRelationFilter.schema'
import { InitiativeListRelationFilterObjectSchema } from './InitiativeListRelationFilter.schema'
import { GoalListRelationFilterObjectSchema } from './GoalListRelationFilter.schema'
import { IndustryGicsRelationFilterObjectSchema } from './IndustryGicsRelationFilter.schema'
import { IndustryGicsWhereInputObjectSchema } from './IndustryGicsWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.CompanyWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => CompanyWhereInputObjectSchema),
        z.lazy(() => CompanyWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => CompanyWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => CompanyWhereInputObjectSchema),
        z.lazy(() => CompanyWhereInputObjectSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterObjectSchema), z.number()]).optional(),
    name: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    description: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    wikidataId: z
      .union([z.lazy(() => StringNullableFilterObjectSchema), z.string()])
      .optional()
      .nullable(),
    url: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    industryGicsId: z
      .union([z.lazy(() => IntNullableFilterObjectSchema), z.number()])
      .optional()
      .nullable(),
    fiscalYears: z
      .lazy(() => FiscalYearListRelationFilterObjectSchema)
      .optional(),
    initiatives: z
      .lazy(() => InitiativeListRelationFilterObjectSchema)
      .optional(),
    goals: z.lazy(() => GoalListRelationFilterObjectSchema).optional(),
    industryGics: z
      .union([
        z.lazy(() => IndustryGicsRelationFilterObjectSchema),
        z.lazy(() => IndustryGicsWhereInputObjectSchema),
      ])
      .optional()
      .nullable(),
  })
  .strict()

export const CompanyWhereInputObjectSchema = Schema
