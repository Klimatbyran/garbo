import { z } from 'zod'
import { Scope3CategoryWhereInputObjectSchema } from './objects/Scope3CategoryWhereInput.schema'

export const Scope3CategoryDeleteManySchema = z.object({
  where: Scope3CategoryWhereInputObjectSchema.optional(),
})
