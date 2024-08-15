import { z } from 'zod'
import { EconomyOrderByWithRelationInputObjectSchema } from './objects/EconomyOrderByWithRelationInput.schema'
import { EconomyWhereInputObjectSchema } from './objects/EconomyWhereInput.schema'
import { EconomyWhereUniqueInputObjectSchema } from './objects/EconomyWhereUniqueInput.schema'
import { EconomyCountAggregateInputObjectSchema } from './objects/EconomyCountAggregateInput.schema'
import { EconomyMinAggregateInputObjectSchema } from './objects/EconomyMinAggregateInput.schema'
import { EconomyMaxAggregateInputObjectSchema } from './objects/EconomyMaxAggregateInput.schema'
import { EconomyAvgAggregateInputObjectSchema } from './objects/EconomyAvgAggregateInput.schema'
import { EconomySumAggregateInputObjectSchema } from './objects/EconomySumAggregateInput.schema'

export const EconomyAggregateSchema = z.object({
  orderBy: z
    .union([
      EconomyOrderByWithRelationInputObjectSchema,
      EconomyOrderByWithRelationInputObjectSchema.array(),
    ])
    .optional(),
  where: EconomyWhereInputObjectSchema.optional(),
  cursor: EconomyWhereUniqueInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  _count: z
    .union([z.literal(true), EconomyCountAggregateInputObjectSchema])
    .optional(),
  _min: EconomyMinAggregateInputObjectSchema.optional(),
  _max: EconomyMaxAggregateInputObjectSchema.optional(),
  _avg: EconomyAvgAggregateInputObjectSchema.optional(),
  _sum: EconomySumAggregateInputObjectSchema.optional(),
})
