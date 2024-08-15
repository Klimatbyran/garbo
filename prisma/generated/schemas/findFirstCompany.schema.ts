import { z } from 'zod'
import { CompanyOrderByWithRelationInputObjectSchema } from './objects/CompanyOrderByWithRelationInput.schema'
import { CompanyWhereInputObjectSchema } from './objects/CompanyWhereInput.schema'
import { CompanyWhereUniqueInputObjectSchema } from './objects/CompanyWhereUniqueInput.schema'
import { CompanyScalarFieldEnumSchema } from './enums/CompanyScalarFieldEnum.schema'

export const CompanyFindFirstSchema = z.object({
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
  distinct: z.array(CompanyScalarFieldEnumSchema).optional(),
})
