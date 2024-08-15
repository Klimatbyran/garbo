import { z } from 'zod'
import { Scope2WhereUniqueInputObjectSchema } from './objects/Scope2WhereUniqueInput.schema'

export const Scope2FindUniqueSchema = z.object({
  where: Scope2WhereUniqueInputObjectSchema,
})
