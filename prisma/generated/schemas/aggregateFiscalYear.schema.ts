import { z } from 'zod'
import { FiscalYearOrderByWithRelationInputObjectSchema } from './objects/FiscalYearOrderByWithRelationInput.schema'
import { FiscalYearWhereInputObjectSchema } from './objects/FiscalYearWhereInput.schema'
import { FiscalYearWhereUniqueInputObjectSchema } from './objects/FiscalYearWhereUniqueInput.schema'
import { FiscalYearCountAggregateInputObjectSchema } from './objects/FiscalYearCountAggregateInput.schema'
import { FiscalYearMinAggregateInputObjectSchema } from './objects/FiscalYearMinAggregateInput.schema'
import { FiscalYearMaxAggregateInputObjectSchema } from './objects/FiscalYearMaxAggregateInput.schema'
import { FiscalYearAvgAggregateInputObjectSchema } from './objects/FiscalYearAvgAggregateInput.schema'
import { FiscalYearSumAggregateInputObjectSchema } from './objects/FiscalYearSumAggregateInput.schema'

export const FiscalYearAggregateSchema = z.object({
  orderBy: z
    .union([
      FiscalYearOrderByWithRelationInputObjectSchema,
      FiscalYearOrderByWithRelationInputObjectSchema.array(),
    ])
    .optional(),
  where: FiscalYearWhereInputObjectSchema.optional(),
  cursor: FiscalYearWhereUniqueInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  _count: z
    .union([z.literal(true), FiscalYearCountAggregateInputObjectSchema])
    .optional(),
  _min: FiscalYearMinAggregateInputObjectSchema.optional(),
  _max: FiscalYearMaxAggregateInputObjectSchema.optional(),
  _avg: FiscalYearAvgAggregateInputObjectSchema.optional(),
  _sum: FiscalYearSumAggregateInputObjectSchema.optional(),
})
