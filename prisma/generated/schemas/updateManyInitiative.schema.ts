import { z } from 'zod'
import { InitiativeUpdateManyMutationInputObjectSchema } from './objects/InitiativeUpdateManyMutationInput.schema'
import { InitiativeWhereInputObjectSchema } from './objects/InitiativeWhereInput.schema'

export const InitiativeUpdateManySchema = z.object({
  data: InitiativeUpdateManyMutationInputObjectSchema,
  where: InitiativeWhereInputObjectSchema.optional(),
})
