import { z } from 'zod'
import { Scope3OrderByWithRelationInputObjectSchema } from './objects/Scope3OrderByWithRelationInput.schema'
import { Scope3WhereInputObjectSchema } from './objects/Scope3WhereInput.schema'
import { Scope3WhereUniqueInputObjectSchema } from './objects/Scope3WhereUniqueInput.schema'
import { Scope3ScalarFieldEnumSchema } from './enums/Scope3ScalarFieldEnum.schema'

export const Scope3FindManySchema = z.object({
  orderBy: z
    .union([
      Scope3OrderByWithRelationInputObjectSchema,
      Scope3OrderByWithRelationInputObjectSchema.array(),
    ])
    .optional(),
  where: Scope3WhereInputObjectSchema.optional(),
  cursor: Scope3WhereUniqueInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.array(Scope3ScalarFieldEnumSchema).optional(),
})
