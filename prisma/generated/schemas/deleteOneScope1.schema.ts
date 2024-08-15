import { z } from 'zod'
import { Scope1WhereUniqueInputObjectSchema } from './objects/Scope1WhereUniqueInput.schema'

export const Scope1DeleteOneSchema = z.object({
  where: Scope1WhereUniqueInputObjectSchema,
})
