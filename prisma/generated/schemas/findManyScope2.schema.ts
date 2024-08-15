import { z } from 'zod'
import { Scope2OrderByWithRelationInputObjectSchema } from './objects/Scope2OrderByWithRelationInput.schema'
import { Scope2WhereInputObjectSchema } from './objects/Scope2WhereInput.schema'
import { Scope2WhereUniqueInputObjectSchema } from './objects/Scope2WhereUniqueInput.schema'
import { Scope2ScalarFieldEnumSchema } from './enums/Scope2ScalarFieldEnum.schema'

export const Scope2FindManySchema = z.object({
  orderBy: z
    .union([
      Scope2OrderByWithRelationInputObjectSchema,
      Scope2OrderByWithRelationInputObjectSchema.array(),
    ])
    .optional(),
  where: Scope2WhereInputObjectSchema.optional(),
  cursor: Scope2WhereUniqueInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.array(Scope2ScalarFieldEnumSchema).optional(),
})
