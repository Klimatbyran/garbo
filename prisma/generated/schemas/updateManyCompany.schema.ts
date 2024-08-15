import { z } from 'zod'
import { CompanyUpdateManyMutationInputObjectSchema } from './objects/CompanyUpdateManyMutationInput.schema'
import { CompanyWhereInputObjectSchema } from './objects/CompanyWhereInput.schema'

export const CompanyUpdateManySchema = z.object({
  data: CompanyUpdateManyMutationInputObjectSchema,
  where: CompanyWhereInputObjectSchema.optional(),
})
