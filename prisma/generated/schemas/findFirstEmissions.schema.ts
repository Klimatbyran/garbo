import { z } from 'zod'
import { EmissionsOrderByWithRelationInputObjectSchema } from './objects/EmissionsOrderByWithRelationInput.schema'
import { EmissionsWhereInputObjectSchema } from './objects/EmissionsWhereInput.schema'
import { EmissionsWhereUniqueInputObjectSchema } from './objects/EmissionsWhereUniqueInput.schema'
import { EmissionsScalarFieldEnumSchema } from './enums/EmissionsScalarFieldEnum.schema'

export const EmissionsFindFirstSchema = z.object({
  orderBy: z
    .union([
      EmissionsOrderByWithRelationInputObjectSchema,
      EmissionsOrderByWithRelationInputObjectSchema.array(),
    ])
    .optional(),
  where: EmissionsWhereInputObjectSchema.optional(),
  cursor: EmissionsWhereUniqueInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.array(EmissionsScalarFieldEnumSchema).optional(),
})
