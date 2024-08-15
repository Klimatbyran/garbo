import { z } from 'zod'
import { Scope1UpdateManyMutationInputObjectSchema } from './objects/Scope1UpdateManyMutationInput.schema'
import { Scope1WhereInputObjectSchema } from './objects/Scope1WhereInput.schema'

export const Scope1UpdateManySchema = z.object({
  data: Scope1UpdateManyMutationInputObjectSchema,
  where: Scope1WhereInputObjectSchema.optional(),
})
