import { z } from 'zod'
import { Scope3CreateInputObjectSchema } from './objects/Scope3CreateInput.schema'
import { Scope3UncheckedCreateInputObjectSchema } from './objects/Scope3UncheckedCreateInput.schema'

export const Scope3CreateOneSchema = z.object({
  data: z.union([
    Scope3CreateInputObjectSchema,
    Scope3UncheckedCreateInputObjectSchema,
  ]),
})
