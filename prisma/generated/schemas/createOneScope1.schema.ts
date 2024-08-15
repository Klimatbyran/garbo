import { z } from 'zod'
import { Scope1CreateInputObjectSchema } from './objects/Scope1CreateInput.schema'
import { Scope1UncheckedCreateInputObjectSchema } from './objects/Scope1UncheckedCreateInput.schema'

export const Scope1CreateOneSchema = z.object({
  data: z.union([
    Scope1CreateInputObjectSchema,
    Scope1UncheckedCreateInputObjectSchema,
  ]),
})
