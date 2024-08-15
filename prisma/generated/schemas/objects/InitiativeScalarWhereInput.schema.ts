import { z } from 'zod'
import { IntFilterObjectSchema } from './IntFilter.schema'
import { StringFilterObjectSchema } from './StringFilter.schema'
import { StringNullableFilterObjectSchema } from './StringNullableFilter.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.InitiativeScalarWhereInput> = z
  .object({
    AND: z
      .union([
        z.lazy(() => InitiativeScalarWhereInputObjectSchema),
        z.lazy(() => InitiativeScalarWhereInputObjectSchema).array(),
      ])
      .optional(),
    OR: z
      .lazy(() => InitiativeScalarWhereInputObjectSchema)
      .array()
      .optional(),
    NOT: z
      .union([
        z.lazy(() => InitiativeScalarWhereInputObjectSchema),
        z.lazy(() => InitiativeScalarWhereInputObjectSchema).array(),
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
  })
  .strict()

export const InitiativeScalarWhereInputObjectSchema = Schema
