import { z } from 'zod'
import { Scope2WhereInputObjectSchema } from './objects/Scope2WhereInput.schema'
import { Scope2OrderByWithAggregationInputObjectSchema } from './objects/Scope2OrderByWithAggregationInput.schema'
import { Scope2ScalarWhereWithAggregatesInputObjectSchema } from './objects/Scope2ScalarWhereWithAggregatesInput.schema'
import { Scope2ScalarFieldEnumSchema } from './enums/Scope2ScalarFieldEnum.schema'

export const Scope2GroupBySchema = z.object({
  where: Scope2WhereInputObjectSchema.optional(),
  orderBy: z
    .union([
      Scope2OrderByWithAggregationInputObjectSchema,
      Scope2OrderByWithAggregationInputObjectSchema.array(),
    ])
    .optional(),
  having: Scope2ScalarWhereWithAggregatesInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  by: z.array(Scope2ScalarFieldEnumSchema),
})
