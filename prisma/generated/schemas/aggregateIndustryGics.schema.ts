import { z } from 'zod'
import { IndustryGicsOrderByWithRelationInputObjectSchema } from './objects/IndustryGicsOrderByWithRelationInput.schema'
import { IndustryGicsWhereInputObjectSchema } from './objects/IndustryGicsWhereInput.schema'
import { IndustryGicsWhereUniqueInputObjectSchema } from './objects/IndustryGicsWhereUniqueInput.schema'
import { IndustryGicsCountAggregateInputObjectSchema } from './objects/IndustryGicsCountAggregateInput.schema'
import { IndustryGicsMinAggregateInputObjectSchema } from './objects/IndustryGicsMinAggregateInput.schema'
import { IndustryGicsMaxAggregateInputObjectSchema } from './objects/IndustryGicsMaxAggregateInput.schema'
import { IndustryGicsAvgAggregateInputObjectSchema } from './objects/IndustryGicsAvgAggregateInput.schema'
import { IndustryGicsSumAggregateInputObjectSchema } from './objects/IndustryGicsSumAggregateInput.schema'

export const IndustryGicsAggregateSchema = z.object({
  orderBy: z
    .union([
      IndustryGicsOrderByWithRelationInputObjectSchema,
      IndustryGicsOrderByWithRelationInputObjectSchema.array(),
    ])
    .optional(),
  where: IndustryGicsWhereInputObjectSchema.optional(),
  cursor: IndustryGicsWhereUniqueInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  _count: z
    .union([z.literal(true), IndustryGicsCountAggregateInputObjectSchema])
    .optional(),
  _min: IndustryGicsMinAggregateInputObjectSchema.optional(),
  _max: IndustryGicsMaxAggregateInputObjectSchema.optional(),
  _avg: IndustryGicsAvgAggregateInputObjectSchema.optional(),
  _sum: IndustryGicsSumAggregateInputObjectSchema.optional(),
})
