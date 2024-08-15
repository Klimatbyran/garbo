import { z } from 'zod'
import { EconomyUpdateManyMutationInputObjectSchema } from './objects/EconomyUpdateManyMutationInput.schema'
import { EconomyWhereInputObjectSchema } from './objects/EconomyWhereInput.schema'

export const EconomyUpdateManySchema = z.object({
  data: EconomyUpdateManyMutationInputObjectSchema,
  where: EconomyWhereInputObjectSchema.optional(),
})
