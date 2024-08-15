import { z } from 'zod'
import { SortOrderSchema } from '../enums/SortOrder.schema'
import { FiscalYearOrderByWithRelationInputObjectSchema } from './FiscalYearOrderByWithRelationInput.schema'
import { MetadataOrderByWithRelationInputObjectSchema } from './MetadataOrderByWithRelationInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EconomyOrderByWithRelationInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    turnover: z.lazy(() => SortOrderSchema).optional(),
    unit: z.lazy(() => SortOrderSchema).optional(),
    employees: z.lazy(() => SortOrderSchema).optional(),
    metadataId: z.lazy(() => SortOrderSchema).optional(),
    fiscalYearId: z.lazy(() => SortOrderSchema).optional(),
    fiscalYear: z
      .lazy(() => FiscalYearOrderByWithRelationInputObjectSchema)
      .optional(),
    metadata: z
      .lazy(() => MetadataOrderByWithRelationInputObjectSchema)
      .optional(),
  })
  .strict()

export const EconomyOrderByWithRelationInputObjectSchema = Schema
