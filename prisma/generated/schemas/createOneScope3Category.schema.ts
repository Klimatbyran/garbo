import { z } from 'zod'
import { Scope3CategoryCreateInputObjectSchema } from './objects/Scope3CategoryCreateInput.schema'
import { Scope3CategoryUncheckedCreateInputObjectSchema } from './objects/Scope3CategoryUncheckedCreateInput.schema'

export const Scope3CategoryCreateOneSchema = z.object({
  data: z.union([
    Scope3CategoryCreateInputObjectSchema,
    Scope3CategoryUncheckedCreateInputObjectSchema,
  ]),
})
