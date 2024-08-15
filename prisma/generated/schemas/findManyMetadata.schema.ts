import { z } from 'zod'
import { MetadataOrderByWithRelationInputObjectSchema } from './objects/MetadataOrderByWithRelationInput.schema'
import { MetadataWhereInputObjectSchema } from './objects/MetadataWhereInput.schema'
import { MetadataWhereUniqueInputObjectSchema } from './objects/MetadataWhereUniqueInput.schema'
import { MetadataScalarFieldEnumSchema } from './enums/MetadataScalarFieldEnum.schema'

export const MetadataFindManySchema = z.object({
  orderBy: z
    .union([
      MetadataOrderByWithRelationInputObjectSchema,
      MetadataOrderByWithRelationInputObjectSchema.array(),
    ])
    .optional(),
  where: MetadataWhereInputObjectSchema.optional(),
  cursor: MetadataWhereUniqueInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.array(MetadataScalarFieldEnumSchema).optional(),
})
