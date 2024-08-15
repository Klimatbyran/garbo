import { z } from 'zod'
import { Scope3WhereInputObjectSchema } from './objects/Scope3WhereInput.schema'

export const Scope3DeleteManySchema = z.object({
  where: Scope3WhereInputObjectSchema.optional(),
})
