import { z } from 'zod'
import { Scope3WhereUniqueInputObjectSchema } from './objects/Scope3WhereUniqueInput.schema'

export const Scope3DeleteOneSchema = z.object({
  where: Scope3WhereUniqueInputObjectSchema,
})
