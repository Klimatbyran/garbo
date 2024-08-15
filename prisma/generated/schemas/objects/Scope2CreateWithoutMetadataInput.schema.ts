import { z } from 'zod'
import { EmissionsCreateNestedOneWithoutScope2InputObjectSchema } from './EmissionsCreateNestedOneWithoutScope2Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope2CreateWithoutMetadataInput> = z
  .object({
    value: z.number(),
    biogenic: z.number().optional().nullable(),
    unit: z.string(),
    mb: z.number().optional().nullable(),
    lb: z.number().optional().nullable(),
    baseYear: z.string(),
    emissions: z.lazy(
      () => EmissionsCreateNestedOneWithoutScope2InputObjectSchema
    ),
  })
  .strict()

export const Scope2CreateWithoutMetadataInputObjectSchema = Schema
