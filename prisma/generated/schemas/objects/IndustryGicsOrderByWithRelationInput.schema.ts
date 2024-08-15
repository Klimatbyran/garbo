import { z } from 'zod'
import { SortOrderSchema } from '../enums/SortOrder.schema'
import { CompanyOrderByRelationAggregateInputObjectSchema } from './CompanyOrderByRelationAggregateInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.IndustryGicsOrderByWithRelationInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    name: z.lazy(() => SortOrderSchema).optional(),
    sectorCode: z.lazy(() => SortOrderSchema).optional(),
    sectorName: z.lazy(() => SortOrderSchema).optional(),
    groupCode: z.lazy(() => SortOrderSchema).optional(),
    groupName: z.lazy(() => SortOrderSchema).optional(),
    industryCode: z.lazy(() => SortOrderSchema).optional(),
    industryName: z.lazy(() => SortOrderSchema).optional(),
    subIndustryCode: z.lazy(() => SortOrderSchema).optional(),
    subIndustryName: z.lazy(() => SortOrderSchema).optional(),
    companies: z
      .lazy(() => CompanyOrderByRelationAggregateInputObjectSchema)
      .optional(),
  })
  .strict()

export const IndustryGicsOrderByWithRelationInputObjectSchema = Schema
