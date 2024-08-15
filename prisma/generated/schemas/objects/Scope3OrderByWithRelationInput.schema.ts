import { z } from 'zod'
import { SortOrderSchema } from '../enums/SortOrder.schema'
import { SortOrderInputObjectSchema } from './SortOrderInput.schema'
import { EmissionsOrderByWithRelationInputObjectSchema } from './EmissionsOrderByWithRelationInput.schema'
import { Scope3CategoryOrderByRelationAggregateInputObjectSchema } from './Scope3CategoryOrderByRelationAggregateInput.schema'
import { MetadataOrderByWithRelationInputObjectSchema } from './MetadataOrderByWithRelationInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.Scope3OrderByWithRelationInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    value: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputObjectSchema),
      ])
      .optional(),
    biogenic: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputObjectSchema),
      ])
      .optional(),
    unit: z.lazy(() => SortOrderSchema).optional(),
    baseYear: z.lazy(() => SortOrderSchema).optional(),
    metadataId: z.lazy(() => SortOrderSchema).optional(),
    emissionsId: z.lazy(() => SortOrderSchema).optional(),
    emissions: z
      .lazy(() => EmissionsOrderByWithRelationInputObjectSchema)
      .optional(),
    categories: z
      .lazy(() => Scope3CategoryOrderByRelationAggregateInputObjectSchema)
      .optional(),
    metadata: z
      .lazy(() => MetadataOrderByWithRelationInputObjectSchema)
      .optional(),
  })
  .strict()

export const Scope3OrderByWithRelationInputObjectSchema = Schema
