import { z } from 'zod'
import { CompanyUpdateInputObjectSchema } from './objects/CompanyUpdateInput.schema'
import { CompanyUncheckedUpdateInputObjectSchema } from './objects/CompanyUncheckedUpdateInput.schema'
import { CompanyWhereUniqueInputObjectSchema } from './objects/CompanyWhereUniqueInput.schema'

export const CompanyUpdateOneSchema = z.object({
  data: z.union([
    CompanyUpdateInputObjectSchema,
    CompanyUncheckedUpdateInputObjectSchema,
  ]),
  where: CompanyWhereUniqueInputObjectSchema,
})
