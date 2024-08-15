import { z } from 'zod'
import { SortOrderSchema } from '../enums/SortOrder.schema'
import { SortOrderInputObjectSchema } from './SortOrderInput.schema'
import { EconomyOrderByWithRelationInputObjectSchema } from './EconomyOrderByWithRelationInput.schema'
import { EmissionsOrderByWithRelationInputObjectSchema } from './EmissionsOrderByWithRelationInput.schema'
import { CompanyOrderByWithRelationInputObjectSchema } from './CompanyOrderByWithRelationInput.schema'

import type { Prisma } from '@prisma/client'

const Schema: z.ZodType<Prisma.FiscalYearOrderByWithRelationInput> = z
  .object({
    id: z.lazy(() => SortOrderSchema).optional(),
    startYear: z.lazy(() => SortOrderSchema).optional(),
    endYear: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputObjectSchema),
      ])
      .optional(),
    startMonth: z
      .union([
        z.lazy(() => SortOrderSchema),
        z.lazy(() => SortOrderInputObjectSchema),
      ])
      .optional(),
    companyId: z.lazy(() => SortOrderSchema).optional(),
    emissionsId: z.lazy(() => SortOrderSchema).optional(),
    economy: z
      .lazy(() => EconomyOrderByWithRelationInputObjectSchema)
      .optional(),
    emissions: z
      .lazy(() => EmissionsOrderByWithRelationInputObjectSchema)
      .optional(),
    company: z
      .lazy(() => CompanyOrderByWithRelationInputObjectSchema)
      .optional(),
  })
  .strict()

export const FiscalYearOrderByWithRelationInputObjectSchema = Schema
