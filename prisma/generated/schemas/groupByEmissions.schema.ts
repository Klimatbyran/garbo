import { z } from 'zod'
import { EmissionsWhereInputObjectSchema } from './objects/EmissionsWhereInput.schema'
import { EmissionsOrderByWithAggregationInputObjectSchema } from './objects/EmissionsOrderByWithAggregationInput.schema'
import { EmissionsScalarWhereWithAggregatesInputObjectSchema } from './objects/EmissionsScalarWhereWithAggregatesInput.schema'
import { EmissionsScalarFieldEnumSchema } from './enums/EmissionsScalarFieldEnum.schema'

export const EmissionsGroupBySchema = z.object({
  where: EmissionsWhereInputObjectSchema.optional(),
  orderBy: z
    .union([
      EmissionsOrderByWithAggregationInputObjectSchema,
      EmissionsOrderByWithAggregationInputObjectSchema.array(),
    ])
    .optional(),
  having: EmissionsScalarWhereWithAggregatesInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  by: z.array(EmissionsScalarFieldEnumSchema),
})
