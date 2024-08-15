import { z } from 'zod'
import { MetadataWhereInputObjectSchema } from './objects/MetadataWhereInput.schema'
import { MetadataOrderByWithAggregationInputObjectSchema } from './objects/MetadataOrderByWithAggregationInput.schema'
import { MetadataScalarWhereWithAggregatesInputObjectSchema } from './objects/MetadataScalarWhereWithAggregatesInput.schema'
import { MetadataScalarFieldEnumSchema } from './enums/MetadataScalarFieldEnum.schema'

export const MetadataGroupBySchema = z.object({
  where: MetadataWhereInputObjectSchema.optional(),
  orderBy: z
    .union([
      MetadataOrderByWithAggregationInputObjectSchema,
      MetadataOrderByWithAggregationInputObjectSchema.array(),
    ])
    .optional(),
  having: MetadataScalarWhereWithAggregatesInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  by: z.array(MetadataScalarFieldEnumSchema),
})
