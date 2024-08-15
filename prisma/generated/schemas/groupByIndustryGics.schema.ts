import { z } from 'zod'
import { IndustryGicsWhereInputObjectSchema } from './objects/IndustryGicsWhereInput.schema'
import { IndustryGicsOrderByWithAggregationInputObjectSchema } from './objects/IndustryGicsOrderByWithAggregationInput.schema'
import { IndustryGicsScalarWhereWithAggregatesInputObjectSchema } from './objects/IndustryGicsScalarWhereWithAggregatesInput.schema'
import { IndustryGicsScalarFieldEnumSchema } from './enums/IndustryGicsScalarFieldEnum.schema'

export const IndustryGicsGroupBySchema = z.object({
  where: IndustryGicsWhereInputObjectSchema.optional(),
  orderBy: z
    .union([
      IndustryGicsOrderByWithAggregationInputObjectSchema,
      IndustryGicsOrderByWithAggregationInputObjectSchema.array(),
    ])
    .optional(),
  having: IndustryGicsScalarWhereWithAggregatesInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  by: z.array(IndustryGicsScalarFieldEnumSchema),
})
