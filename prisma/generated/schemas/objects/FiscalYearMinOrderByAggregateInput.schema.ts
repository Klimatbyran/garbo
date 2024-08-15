import { z } from 'zod'
import { SortOrderSchema } from '../enums/SortOrder.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.FiscalYearMinOrderByAggregateInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    startYear: z.lazy(() => SortOrderSchema).optional(),
    endYear: z.lazy(() => SortOrderSchema).optional(),
    startMonth: z.lazy(() => SortOrderSchema).optional(),
    companyId: z.lazy(() => SortOrderSchema).optional(),
    emissionsId: z.lazy(() => SortOrderSchema).optional(),
  })
  .strict()

export const FiscalYearMinOrderByAggregateInputObjectSchema = Schema
