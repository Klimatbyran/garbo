import { z } from 'zod'
import { Scope3CategoryUpdateManyMutationInputObjectSchema } from './objects/Scope3CategoryUpdateManyMutationInput.schema'
import { Scope3CategoryWhereInputObjectSchema } from './objects/Scope3CategoryWhereInput.schema'

export const Scope3CategoryUpdateManySchema = z.object({
  data: Scope3CategoryUpdateManyMutationInputObjectSchema,
  where: Scope3CategoryWhereInputObjectSchema.optional(),
})
