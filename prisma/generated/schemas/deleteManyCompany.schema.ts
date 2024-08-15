import { z } from 'zod'
import { CompanyWhereInputObjectSchema } from './objects/CompanyWhereInput.schema'

export const CompanyDeleteManySchema = z.object({
  where: CompanyWhereInputObjectSchema.optional(),
})
