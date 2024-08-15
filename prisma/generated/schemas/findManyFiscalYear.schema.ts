import { z } from 'zod'
import { FiscalYearOrderByWithRelationInputObjectSchema } from './objects/FiscalYearOrderByWithRelationInput.schema'
import { FiscalYearWhereInputObjectSchema } from './objects/FiscalYearWhereInput.schema'
import { FiscalYearWhereUniqueInputObjectSchema } from './objects/FiscalYearWhereUniqueInput.schema'
import { FiscalYearScalarFieldEnumSchema } from './enums/FiscalYearScalarFieldEnum.schema'

export const FiscalYearFindManySchema = z.object({
  orderBy: z
    .union([
      FiscalYearOrderByWithRelationInputObjectSchema,
      FiscalYearOrderByWithRelationInputObjectSchema.array(),
    ])
    .optional(),
  where: FiscalYearWhereInputObjectSchema.optional(),
  cursor: FiscalYearWhereUniqueInputObjectSchema.optional(),
  take: z.number().optional(),
  skip: z.number().optional(),
  distinct: z.array(FiscalYearScalarFieldEnumSchema).optional(),
})
