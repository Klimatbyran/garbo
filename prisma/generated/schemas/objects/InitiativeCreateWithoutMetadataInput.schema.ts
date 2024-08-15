import { z } from 'zod'
import { CompanyCreateNestedOneWithoutInitiativesInputObjectSchema } from './CompanyCreateNestedOneWithoutInitiativesInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.InitiativeCreateWithoutMetadataInput> = z
  .object({
    title: z.string(),
    description: z.string(),
    year: z.string().optional().nullable(),
    scope: z.string(),
    company: z.lazy(
      () => CompanyCreateNestedOneWithoutInitiativesInputObjectSchema
    ),
  })
  .strict()

export const InitiativeCreateWithoutMetadataInputObjectSchema = Schema
