import { z } from 'zod'
import { InitiativeOrderByWithRelationInputObjectSchema } from './objects/InitiativeOrderByWithRelationInput.schema'
import { InitiativeWhereInputObjectSchema } from './objects/InitiativeWhereInput.schema'
import { InitiativeWhereUniqueInputObjectSchema } from './objects/InitiativeWhereUniqueInput.schema'
import { InitiativeScalarFieldEnumSchema } from './enums/InitiativeScalarFieldEnum.schema'

export const InitiativeFindFirstSchema = z.object({
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
  distinct: z.array(InitiativeScalarFieldEnumSchema).optional(),
})
