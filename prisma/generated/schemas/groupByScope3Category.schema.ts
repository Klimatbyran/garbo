import { z } from 'zod'
import { Scope3CategoryWhereInputObjectSchema } from './objects/Scope3CategoryWhereInput.schema'
import { Scope3CategoryOrderByWithAggregationInputObjectSchema } from './objects/Scope3CategoryOrderByWithAggregationInput.schema'
import { Scope3CategoryScalarWhereWithAggregatesInputObjectSchema } from './objects/Scope3CategoryScalarWhereWithAggregatesInput.schema'
import { Scope3CategoryScalarFieldEnumSchema } from './enums/Scope3CategoryScalarFieldEnum.schema'

export const Scope3CategoryGroupBySchema = z.object({
  where: Scope3CategoryWhereInputObjectSchema.optional(),
  orderBy: z
    .union([
      Scope3CategoryOrderByWithAggregationInputObjectSchema,
      Scope3CategoryOrderByWithAggregationInputObjectSchema.array(),
    ])
    .optional(),
  having: Scope3CategoryScalarWhereWithAggregatesInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  by: z.array(Scope3CategoryScalarFieldEnumSchema),
})
