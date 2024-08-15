import { z } from 'zod'
import { Scope3UpdateManyMutationInputObjectSchema } from './objects/Scope3UpdateManyMutationInput.schema'
import { Scope3WhereInputObjectSchema } from './objects/Scope3WhereInput.schema'

export const Scope3UpdateManySchema = z.object({
  data: Scope3UpdateManyMutationInputObjectSchema,
  where: Scope3WhereInputObjectSchema.optional(),
})
