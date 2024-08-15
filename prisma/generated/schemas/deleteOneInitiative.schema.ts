import { z } from 'zod'
import { InitiativeWhereUniqueInputObjectSchema } from './objects/InitiativeWhereUniqueInput.schema'

export const InitiativeDeleteOneSchema = z.object({
  where: InitiativeWhereUniqueInputObjectSchema,
})
