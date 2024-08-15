import { z } from 'zod'
import { CompanyWhereUniqueInputObjectSchema } from './objects/CompanyWhereUniqueInput.schema'

export const CompanyFindUniqueSchema = z.object({
  where: CompanyWhereUniqueInputObjectSchema,
})
