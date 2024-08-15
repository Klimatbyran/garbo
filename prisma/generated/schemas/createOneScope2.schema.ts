import { z } from 'zod'
import { Scope2CreateInputObjectSchema } from './objects/Scope2CreateInput.schema'
import { Scope2UncheckedCreateInputObjectSchema } from './objects/Scope2UncheckedCreateInput.schema'

export const Scope2CreateOneSchema = z.object({
  data: z.union([
    Scope2CreateInputObjectSchema,
    Scope2UncheckedCreateInputObjectSchema,
  ]),
})
