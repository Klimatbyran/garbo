import { z } from 'zod'
import { Scope3CategoryOrderByWithRelationInputObjectSchema } from './objects/Scope3CategoryOrderByWithRelationInput.schema'
import { Scope3CategoryWhereInputObjectSchema } from './objects/Scope3CategoryWhereInput.schema'
import { Scope3CategoryWhereUniqueInputObjectSchema } from './objects/Scope3CategoryWhereUniqueInput.schema'
import { Scope3CategoryScalarFieldEnumSchema } from './enums/Scope3CategoryScalarFieldEnum.schema'

export const Scope3CategoryFindFirstSchema = z.object({
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
  distinct: z.array(Scope3CategoryScalarFieldEnumSchema).optional(),
})
