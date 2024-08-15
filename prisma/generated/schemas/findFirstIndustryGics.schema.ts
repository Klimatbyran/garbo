import { z } from 'zod'
import { IndustryGicsOrderByWithRelationInputObjectSchema } from './objects/IndustryGicsOrderByWithRelationInput.schema'
import { IndustryGicsWhereInputObjectSchema } from './objects/IndustryGicsWhereInput.schema'
import { IndustryGicsWhereUniqueInputObjectSchema } from './objects/IndustryGicsWhereUniqueInput.schema'
import { IndustryGicsScalarFieldEnumSchema } from './enums/IndustryGicsScalarFieldEnum.schema'

export const IndustryGicsFindFirstSchema = z.object({
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
  distinct: z.array(IndustryGicsScalarFieldEnumSchema).optional(),
})
