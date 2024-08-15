import { z } from 'zod'
import { Scope3CategoryWhereUniqueInputObjectSchema } from './objects/Scope3CategoryWhereUniqueInput.schema'

export const Scope3CategoryFindUniqueSchema = z.object({
  where: Scope3CategoryWhereUniqueInputObjectSchema,
})
