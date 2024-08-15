import { z } from 'zod'
import { InitiativeWhereUniqueInputObjectSchema } from './objects/InitiativeWhereUniqueInput.schema'

export const InitiativeFindUniqueSchema = z.object({
  where: InitiativeWhereUniqueInputObjectSchema,
})
