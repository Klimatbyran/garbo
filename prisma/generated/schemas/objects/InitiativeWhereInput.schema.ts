import { z } from 'zod'
import { IntFilterObjectSchema } from './IntFilter.schema'
import { StringFilterObjectSchema } from './StringFilter.schema'
import { StringNullableFilterObjectSchema } from './StringNullableFilter.schema'
import { CompanyRelationFilterObjectSchema } from './CompanyRelationFilter.schema'
import { CompanyWhereInputObjectSchema } from './CompanyWhereInput.schema'
import { MetadataRelationFilterObjectSchema } from './MetadataRelationFilter.schema'
import { MetadataWhereInputObjectSchema } from './MetadataWhereInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.InitiativeWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => InitiativeWhereInputObjectSchema),
        z.lazy(() => InitiativeWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => InitiativeWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => InitiativeWhereInputObjectSchema),
        z.lazy(() => InitiativeWhereInputObjectSchema).array(),
      ])
      .optional(),
    id: z.union([z.lazy(() => IntFilterObjectSchema), z.number()]).optional(),
    title: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    description: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    year: z
      .union([z.lazy(() => StringNullableFilterObjectSchema), z.string()])
      .optional()
      .nullable(),
    scope: z
      .union([z.lazy(() => StringFilterObjectSchema), z.string()])
      .optional(),
    companyId: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    metadataId: z
      .union([z.lazy(() => IntFilterObjectSchema), z.number()])
      .optional(),
    company: z
      .union([
        z.lazy(() => CompanyRelationFilterObjectSchema),
        z.lazy(() => CompanyWhereInputObjectSchema),
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

export const InitiativeWhereInputObjectSchema = Schema
