import { z } from 'zod'
import { MetadataOrderByWithRelationInputObjectSchema } from './objects/MetadataOrderByWithRelationInput.schema'
import { MetadataWhereInputObjectSchema } from './objects/MetadataWhereInput.schema'
import { MetadataWhereUniqueInputObjectSchema } from './objects/MetadataWhereUniqueInput.schema'
import { MetadataCountAggregateInputObjectSchema } from './objects/MetadataCountAggregateInput.schema'
import { MetadataMinAggregateInputObjectSchema } from './objects/MetadataMinAggregateInput.schema'
import { MetadataMaxAggregateInputObjectSchema } from './objects/MetadataMaxAggregateInput.schema'
import { MetadataAvgAggregateInputObjectSchema } from './objects/MetadataAvgAggregateInput.schema'
import { MetadataSumAggregateInputObjectSchema } from './objects/MetadataSumAggregateInput.schema'

export const MetadataAggregateSchema = z.object({
  orderBy: z
    .union([
      MetadataOrderByWithRelationInputObjectSchema,
      MetadataOrderByWithRelationInputObjectSchema.array(),
    ])
    .optional(),
  where: MetadataWhereInputObjectSchema.optional(),
  cursor: MetadataWhereUniqueInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  _count: z
    .union([z.literal(true), MetadataCountAggregateInputObjectSchema])
    .optional(),
  _min: MetadataMinAggregateInputObjectSchema.optional(),
  _max: MetadataMaxAggregateInputObjectSchema.optional(),
  _avg: MetadataAvgAggregateInputObjectSchema.optional(),
  _sum: MetadataSumAggregateInputObjectSchema.optional(),
})
