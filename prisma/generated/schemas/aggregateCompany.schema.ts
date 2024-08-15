import { z } from 'zod'
import { CompanyOrderByWithRelationInputObjectSchema } from './objects/CompanyOrderByWithRelationInput.schema'
import { CompanyWhereInputObjectSchema } from './objects/CompanyWhereInput.schema'
import { CompanyWhereUniqueInputObjectSchema } from './objects/CompanyWhereUniqueInput.schema'
import { CompanyCountAggregateInputObjectSchema } from './objects/CompanyCountAggregateInput.schema'
import { CompanyMinAggregateInputObjectSchema } from './objects/CompanyMinAggregateInput.schema'
import { CompanyMaxAggregateInputObjectSchema } from './objects/CompanyMaxAggregateInput.schema'
import { CompanyAvgAggregateInputObjectSchema } from './objects/CompanyAvgAggregateInput.schema'
import { CompanySumAggregateInputObjectSchema } from './objects/CompanySumAggregateInput.schema'

export const CompanyAggregateSchema = z.object({
  orderBy: z
    .union([
      CompanyOrderByWithRelationInputObjectSchema,
      CompanyOrderByWithRelationInputObjectSchema.array(),
    ])
    .optional(),
  where: CompanyWhereInputObjectSchema.optional(),
  cursor: CompanyWhereUniqueInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  _count: z
    .union([z.literal(true), CompanyCountAggregateInputObjectSchema])
    .optional(),
  _min: CompanyMinAggregateInputObjectSchema.optional(),
  _max: CompanyMaxAggregateInputObjectSchema.optional(),
  _avg: CompanyAvgAggregateInputObjectSchema.optional(),
  _sum: CompanySumAggregateInputObjectSchema.optional(),
})
