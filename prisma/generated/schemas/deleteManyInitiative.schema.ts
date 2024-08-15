import { z } from 'zod'
import { InitiativeWhereInputObjectSchema } from './objects/InitiativeWhereInput.schema'

export const InitiativeDeleteManySchema = z.object({
  where: InitiativeWhereInputObjectSchema.optional(),
})
