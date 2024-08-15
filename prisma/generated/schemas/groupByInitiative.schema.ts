import { z } from 'zod'
import { InitiativeWhereInputObjectSchema } from './objects/InitiativeWhereInput.schema'
import { InitiativeOrderByWithAggregationInputObjectSchema } from './objects/InitiativeOrderByWithAggregationInput.schema'
import { InitiativeScalarWhereWithAggregatesInputObjectSchema } from './objects/InitiativeScalarWhereWithAggregatesInput.schema'
import { InitiativeScalarFieldEnumSchema } from './enums/InitiativeScalarFieldEnum.schema'

export const InitiativeGroupBySchema = z.object({
  where: InitiativeWhereInputObjectSchema.optional(),
  orderBy: z
    .union([
      InitiativeOrderByWithAggregationInputObjectSchema,
      InitiativeOrderByWithAggregationInputObjectSchema.array(),
    ])
    .optional(),
  having: InitiativeScalarWhereWithAggregatesInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  by: z.array(InitiativeScalarFieldEnumSchema),
})
