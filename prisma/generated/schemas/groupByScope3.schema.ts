import { z } from 'zod'
import { Scope3WhereInputObjectSchema } from './objects/Scope3WhereInput.schema'
import { Scope3OrderByWithAggregationInputObjectSchema } from './objects/Scope3OrderByWithAggregationInput.schema'
import { Scope3ScalarWhereWithAggregatesInputObjectSchema } from './objects/Scope3ScalarWhereWithAggregatesInput.schema'
import { Scope3ScalarFieldEnumSchema } from './enums/Scope3ScalarFieldEnum.schema'

export const Scope3GroupBySchema = z.object({
  where: Scope3WhereInputObjectSchema.optional(),
  orderBy: z
    .union([
      Scope3OrderByWithAggregationInputObjectSchema,
      Scope3OrderByWithAggregationInputObjectSchema.array(),
    ])
    .optional(),
  having: Scope3ScalarWhereWithAggregatesInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  by: z.array(Scope3ScalarFieldEnumSchema),
})
