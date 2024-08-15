import { z } from 'zod'
import { MetadataCreateNestedOneWithoutInitiativeInputObjectSchema } from './MetadataCreateNestedOneWithoutInitiativeInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.InitiativeCreateWithoutCompanyInput> = z
  .object({
    title: z.string(),
    description: z.string(),
    year: z.string().optional().nullable(),
    scope: z.string(),
    metadata: z.lazy(
      () => MetadataCreateNestedOneWithoutInitiativeInputObjectSchema
    ),
  })
  .strict()

export const InitiativeCreateWithoutCompanyInputObjectSchema = Schema
