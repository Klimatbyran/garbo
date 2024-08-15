import { z } from 'zod'
import { Scope2WhereInputObjectSchema } from './objects/Scope2WhereInput.schema'

export const Scope2DeleteManySchema = z.object({
  where: Scope2WhereInputObjectSchema.optional(),
})
