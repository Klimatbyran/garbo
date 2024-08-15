import { z } from 'zod'
import { EmissionsOrderByWithRelationInputObjectSchema } from './objects/EmissionsOrderByWithRelationInput.schema'
import { EmissionsWhereInputObjectSchema } from './objects/EmissionsWhereInput.schema'
import { EmissionsWhereUniqueInputObjectSchema } from './objects/EmissionsWhereUniqueInput.schema'
import { EmissionsCountAggregateInputObjectSchema } from './objects/EmissionsCountAggregateInput.schema'
import { EmissionsMinAggregateInputObjectSchema } from './objects/EmissionsMinAggregateInput.schema'
import { EmissionsMaxAggregateInputObjectSchema } from './objects/EmissionsMaxAggregateInput.schema'
import { EmissionsAvgAggregateInputObjectSchema } from './objects/EmissionsAvgAggregateInput.schema'
import { EmissionsSumAggregateInputObjectSchema } from './objects/EmissionsSumAggregateInput.schema'

export const EmissionsAggregateSchema = z.object({
  orderBy: z
    .union([
      EmissionsOrderByWithRelationInputObjectSchema,
      EmissionsOrderByWithRelationInputObjectSchema.array(),
    ])
    .optional(),
  where: EmissionsWhereInputObjectSchema.optional(),
  cursor: EmissionsWhereUniqueInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  _count: z
    .union([z.literal(true), EmissionsCountAggregateInputObjectSchema])
    .optional(),
  _min: EmissionsMinAggregateInputObjectSchema.optional(),
  _max: EmissionsMaxAggregateInputObjectSchema.optional(),
  _avg: EmissionsAvgAggregateInputObjectSchema.optional(),
  _sum: EmissionsSumAggregateInputObjectSchema.optional(),
})
