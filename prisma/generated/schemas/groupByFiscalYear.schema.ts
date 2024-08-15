import { z } from 'zod'
import { FiscalYearWhereInputObjectSchema } from './objects/FiscalYearWhereInput.schema'
import { FiscalYearOrderByWithAggregationInputObjectSchema } from './objects/FiscalYearOrderByWithAggregationInput.schema'
import { FiscalYearScalarWhereWithAggregatesInputObjectSchema } from './objects/FiscalYearScalarWhereWithAggregatesInput.schema'
import { FiscalYearScalarFieldEnumSchema } from './enums/FiscalYearScalarFieldEnum.schema'

export const FiscalYearGroupBySchema = z.object({
  where: FiscalYearWhereInputObjectSchema.optional(),
  orderBy: z
    .union([
      FiscalYearOrderByWithAggregationInputObjectSchema,
      FiscalYearOrderByWithAggregationInputObjectSchema.array(),
    ])
    .optional(),
  having: FiscalYearScalarWhereWithAggregatesInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  by: z.array(FiscalYearScalarFieldEnumSchema),
})
