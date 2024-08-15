import { z } from 'zod'
import { IntFilterObjectSchema } from './IntFilter.schema'
import { StringFilterObjectSchema } from './StringFilter.schema'
import { CompanyListRelationFilterObjectSchema } from './CompanyListRelationFilter.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.IndustryGicsWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => IndustryGicsWhereInputObjectSchema),
        z.lazy(() => IndustryGicsWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => IndustryGicsWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => IndustryGicsWhereInputObjectSchema),
        z.lazy(() => IndustryGicsWhereInputObjectSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterObjectSchema), z.number()]).optional(),
    name: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    sectorCode: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    sectorName: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    groupCode: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    groupName: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    industryCode: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    industryName: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    subIndustryCode: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    subIndustryName: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    companies: z.lazy(() => CompanyListRelationFilterObjectSchema).optional(),
  })
  .strict()

export const IndustryGicsWhereInputObjectSchema = Schema
