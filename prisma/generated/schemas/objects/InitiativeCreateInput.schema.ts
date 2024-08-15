import { z } from 'zod'
import { CompanyCreateNestedOneWithoutInitiativesInputObjectSchema } from './CompanyCreateNestedOneWithoutInitiativesInput.schema'
import { MetadataCreateNestedOneWithoutInitiativeInputObjectSchema } from './MetadataCreateNestedOneWithoutInitiativeInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.InitiativeCreateInput> = z
  .object({
    title: z.string(),
    description: z.string(),
    year: z.string().optional().nullable(),
    scope: z.string(),
    company: z.lazy(
      () => CompanyCreateNestedOneWithoutInitiativesInputObjectSchema
    ),
    metadata: z.lazy(
      () => MetadataCreateNestedOneWithoutInitiativeInputObjectSchema
    ),
  })
  .strict()

export const InitiativeCreateInputObjectSchema = Schema
