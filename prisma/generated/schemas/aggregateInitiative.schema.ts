import { z } from 'zod'
import { InitiativeOrderByWithRelationInputObjectSchema } from './objects/InitiativeOrderByWithRelationInput.schema'
import { InitiativeWhereInputObjectSchema } from './objects/InitiativeWhereInput.schema'
import { InitiativeWhereUniqueInputObjectSchema } from './objects/InitiativeWhereUniqueInput.schema'
import { InitiativeCountAggregateInputObjectSchema } from './objects/InitiativeCountAggregateInput.schema'
import { InitiativeMinAggregateInputObjectSchema } from './objects/InitiativeMinAggregateInput.schema'
import { InitiativeMaxAggregateInputObjectSchema } from './objects/InitiativeMaxAggregateInput.schema'
import { InitiativeAvgAggregateInputObjectSchema } from './objects/InitiativeAvgAggregateInput.schema'
import { InitiativeSumAggregateInputObjectSchema } from './objects/InitiativeSumAggregateInput.schema'

export const InitiativeAggregateSchema = z.object({
  orderBy: z
    .union([
      InitiativeOrderByWithRelationInputObjectSchema,
      InitiativeOrderByWithRelationInputObjectSchema.array(),
    ])
    .optional(),
  where: InitiativeWhereInputObjectSchema.optional(),
  cursor: InitiativeWhereUniqueInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  _count: z
    .union([z.literal(true), InitiativeCountAggregateInputObjectSchema])
    .optional(),
  _min: InitiativeMinAggregateInputObjectSchema.optional(),
  _max: InitiativeMaxAggregateInputObjectSchema.optional(),
  _avg: InitiativeAvgAggregateInputObjectSchema.optional(),
  _sum: InitiativeSumAggregateInputObjectSchema.optional(),
})
