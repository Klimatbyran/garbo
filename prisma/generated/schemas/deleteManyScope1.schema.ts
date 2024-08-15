import { z } from 'zod'
import { Scope1WhereInputObjectSchema } from './objects/Scope1WhereInput.schema'

export const Scope1DeleteManySchema = z.object({
  where: Scope1WhereInputObjectSchema.optional(),
})
