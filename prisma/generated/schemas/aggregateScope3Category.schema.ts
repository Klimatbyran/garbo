import { z } from 'zod'
import { Scope3CategoryOrderByWithRelationInputObjectSchema } from './objects/Scope3CategoryOrderByWithRelationInput.schema'
import { Scope3CategoryWhereInputObjectSchema } from './objects/Scope3CategoryWhereInput.schema'
import { Scope3CategoryWhereUniqueInputObjectSchema } from './objects/Scope3CategoryWhereUniqueInput.schema'
import { Scope3CategoryCountAggregateInputObjectSchema } from './objects/Scope3CategoryCountAggregateInput.schema'
import { Scope3CategoryMinAggregateInputObjectSchema } from './objects/Scope3CategoryMinAggregateInput.schema'
import { Scope3CategoryMaxAggregateInputObjectSchema } from './objects/Scope3CategoryMaxAggregateInput.schema'
import { Scope3CategoryAvgAggregateInputObjectSchema } from './objects/Scope3CategoryAvgAggregateInput.schema'
import { Scope3CategorySumAggregateInputObjectSchema } from './objects/Scope3CategorySumAggregateInput.schema'

export const Scope3CategoryAggregateSchema = z.object({
  orderBy: z
    .union([
      Scope3CategoryOrderByWithRelationInputObjectSchema,
      Scope3CategoryOrderByWithRelationInputObjectSchema.array(),
    ])
    .optional(),
  where: Scope3CategoryWhereInputObjectSchema.optional(),
  cursor: Scope3CategoryWhereUniqueInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  _count: z
    .union([z.literal(true), Scope3CategoryCountAggregateInputObjectSchema])
    .optional(),
  _min: Scope3CategoryMinAggregateInputObjectSchema.optional(),
  _max: Scope3CategoryMaxAggregateInputObjectSchema.optional(),
  _avg: Scope3CategoryAvgAggregateInputObjectSchema.optional(),
  _sum: Scope3CategorySumAggregateInputObjectSchema.optional(),
})
