import { z } from 'zod'
import { EconomyOrderByWithRelationInputObjectSchema } from './objects/EconomyOrderByWithRelationInput.schema'
import { EconomyWhereInputObjectSchema } from './objects/EconomyWhereInput.schema'
import { EconomyWhereUniqueInputObjectSchema } from './objects/EconomyWhereUniqueInput.schema'
import { EconomyScalarFieldEnumSchema } from './enums/EconomyScalarFieldEnum.schema'

export const EconomyFindFirstSchema = z.object({
  orderBy: z
    .union([
      EconomyOrderByWithRelationInputObjectSchema,
      EconomyOrderByWithRelationInputObjectSchema.array(),
    ])
    .optional(),
  where: EconomyWhereInputObjectSchema.optional(),
  cursor: EconomyWhereUniqueInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.array(EconomyScalarFieldEnumSchema).optional(),
})
