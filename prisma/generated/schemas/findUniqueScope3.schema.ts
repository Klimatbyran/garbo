import { z } from 'zod'
import { Scope3WhereUniqueInputObjectSchema } from './objects/Scope3WhereUniqueInput.schema'

export const Scope3FindUniqueSchema = z.object({
  where: Scope3WhereUniqueInputObjectSchema,
})
