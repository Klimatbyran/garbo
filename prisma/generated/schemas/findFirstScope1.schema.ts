import { z } from 'zod'
import { Scope1OrderByWithRelationInputObjectSchema } from './objects/Scope1OrderByWithRelationInput.schema'
import { Scope1WhereInputObjectSchema } from './objects/Scope1WhereInput.schema'
import { Scope1WhereUniqueInputObjectSchema } from './objects/Scope1WhereUniqueInput.schema'
import { Scope1ScalarFieldEnumSchema } from './enums/Scope1ScalarFieldEnum.schema'

export const Scope1FindFirstSchema = z.object({
  orderBy: z
    .union([
      Scope1OrderByWithRelationInputObjectSchema,
      Scope1OrderByWithRelationInputObjectSchema.array(),
    ])
    .optional(),
  where: Scope1WhereInputObjectSchema.optional(),
  cursor: Scope1WhereUniqueInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.array(Scope1ScalarFieldEnumSchema).optional(),
})
