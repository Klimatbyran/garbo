import { z } from 'zod'
import { CompanyWhereInputObjectSchema } from './objects/CompanyWhereInput.schema'
import { CompanyOrderByWithAggregationInputObjectSchema } from './objects/CompanyOrderByWithAggregationInput.schema'
import { CompanyScalarWhereWithAggregatesInputObjectSchema } from './objects/CompanyScalarWhereWithAggregatesInput.schema'
import { CompanyScalarFieldEnumSchema } from './enums/CompanyScalarFieldEnum.schema'

export const CompanyGroupBySchema = z.object({
  where: CompanyWhereInputObjectSchema.optional(),
  orderBy: z
    .union([
      CompanyOrderByWithAggregationInputObjectSchema,
      CompanyOrderByWithAggregationInputObjectSchema.array(),
    ])
    .optional(),
  having: CompanyScalarWhereWithAggregatesInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  by: z.array(CompanyScalarFieldEnumSchema),
})
