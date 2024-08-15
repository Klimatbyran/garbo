import { z } from 'zod'
import { CompanyWhereUniqueInputObjectSchema } from './objects/CompanyWhereUniqueInput.schema'

export const CompanyDeleteOneSchema = z.object({
  where: CompanyWhereUniqueInputObjectSchema,
})
