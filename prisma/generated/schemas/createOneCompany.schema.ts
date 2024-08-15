import { z } from 'zod'
import { CompanyCreateInputObjectSchema } from './objects/CompanyCreateInput.schema'
import { CompanyUncheckedCreateInputObjectSchema } from './objects/CompanyUncheckedCreateInput.schema'

export const CompanyCreateOneSchema = z.object({
  data: z.union([
    CompanyCreateInputObjectSchema,
    CompanyUncheckedCreateInputObjectSchema,
  ]),
})
