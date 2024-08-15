import { z } from 'zod'
import { SortOrderSchema } from '../enums/SortOrder.schema'
import { FiscalYearOrderByWithRelationInputObjectSchema } from './FiscalYearOrderByWithRelationInput.schema'
import { Scope1OrderByWithRelationInputObjectSchema } from './Scope1OrderByWithRelationInput.schema'
import { Scope2OrderByWithRelationInputObjectSchema } from './Scope2OrderByWithRelationInput.schema'
import { Scope3OrderByWithRelationInputObjectSchema } from './Scope3OrderByWithRelationInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.EmissionsOrderByWithRelationInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    fiscalYearId: z.lazy(() => SortOrderSchema).optional(),
    scope1Id: z.lazy(() => SortOrderSchema).optional(),
    scope2Id: z.lazy(() => SortOrderSchema).optional(),
    scope3Id: z.lazy(() => SortOrderSchema).optional(),
    fiscalYear: z
      .lazy(() => FiscalYearOrderByWithRelationInputObjectSchema)
      .optional(),
    scope1: z.lazy(() => Scope1OrderByWithRelationInputObjectSchema).optional(),
    scope2: z.lazy(() => Scope2OrderByWithRelationInputObjectSchema).optional(),
    scope3: z.lazy(() => Scope3OrderByWithRelationInputObjectSchema).optional(),
  })
  .strict()

export const EmissionsOrderByWithRelationInputObjectSchema = Schema
