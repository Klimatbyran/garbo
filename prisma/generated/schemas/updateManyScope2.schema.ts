import { z } from 'zod'
import { Scope2UpdateManyMutationInputObjectSchema } from './objects/Scope2UpdateManyMutationInput.schema'
import { Scope2WhereInputObjectSchema } from './objects/Scope2WhereInput.schema'

export const Scope2UpdateManySchema = z.object({
  data: Scope2UpdateManyMutationInputObjectSchema,
  where: Scope2WhereInputObjectSchema.optional(),
})
