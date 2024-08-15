import { z } from 'zod'
import { EmissionsCreateNestedOneWithoutScope1InputObjectSchema } from './EmissionsCreateNestedOneWithoutScope1Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope1CreateWithoutMetadataInput> = z
  .object({
    value: z.number(),
    biogenic: z.number().optional().nullable(),
    unit: z.string(),
    baseYear: z.string(),
    emissions: z.lazy(
      () => EmissionsCreateNestedOneWithoutScope1InputObjectSchema
    ),
  })
  .strict()

export const Scope1CreateWithoutMetadataInputObjectSchema = Schema
