import { z } from 'zod'
import { EconomyWhereInputObjectSchema } from './objects/EconomyWhereInput.schema'
import { EconomyOrderByWithAggregationInputObjectSchema } from './objects/EconomyOrderByWithAggregationInput.schema'
import { EconomyScalarWhereWithAggregatesInputObjectSchema } from './objects/EconomyScalarWhereWithAggregatesInput.schema'
import { EconomyScalarFieldEnumSchema } from './enums/EconomyScalarFieldEnum.schema'

export const EconomyGroupBySchema = z.object({
  where: EconomyWhereInputObjectSchema.optional(),
  orderBy: z
    .union([
      EconomyOrderByWithAggregationInputObjectSchema,
      EconomyOrderByWithAggregationInputObjectSchema.array(),
    ])
    .optional(),
  having: EconomyScalarWhereWithAggregatesInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  by: z.array(EconomyScalarFieldEnumSchema),
})
