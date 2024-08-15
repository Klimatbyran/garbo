import { z } from 'zod'
import { EmissionsCreateNestedOneWithoutScope3InputObjectSchema } from './EmissionsCreateNestedOneWithoutScope3Input.schema'
import { Scope3CategoryCreateNestedManyWithoutScope3InputObjectSchema } from './Scope3CategoryCreateNestedManyWithoutScope3Input.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3CreateWithoutMetadataInput> = z
  .object({
    value: z.number().optional().nullable(),
    biogenic: z.number().optional().nullable(),
    unit: z.string(),
    baseYear: z.string(),
    emissions: z.lazy(
      () => EmissionsCreateNestedOneWithoutScope3InputObjectSchema
    ),
    categories: z
      .lazy(() => Scope3CategoryCreateNestedManyWithoutScope3InputObjectSchema)
      .optional(),
  })
  .strict()

export const Scope3CreateWithoutMetadataInputObjectSchema = Schema
