import { z } from 'zod'
import { Scope1WhereInputObjectSchema } from './objects/Scope1WhereInput.schema'
import { Scope1OrderByWithAggregationInputObjectSchema } from './objects/Scope1OrderByWithAggregationInput.schema'
import { Scope1ScalarWhereWithAggregatesInputObjectSchema } from './objects/Scope1ScalarWhereWithAggregatesInput.schema'
import { Scope1ScalarFieldEnumSchema } from './enums/Scope1ScalarFieldEnum.schema'

export const Scope1GroupBySchema = z.object({
  where: Scope1WhereInputObjectSchema.optional(),
  orderBy: z
    .union([
      Scope1OrderByWithAggregationInputObjectSchema,
      Scope1OrderByWithAggregationInputObjectSchema.array(),
    ])
    .optional(),
  having: Scope1ScalarWhereWithAggregatesInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  by: z.array(Scope1ScalarFieldEnumSchema),
})
