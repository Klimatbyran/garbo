import { z } from 'zod'
import { Scope3UpdateInputObjectSchema } from './objects/Scope3UpdateInput.schema'
import { Scope3UncheckedUpdateInputObjectSchema } from './objects/Scope3UncheckedUpdateInput.schema'
import { Scope3WhereUniqueInputObjectSchema } from './objects/Scope3WhereUniqueInput.schema'

export const Scope3UpdateOneSchema = z.object({
  data: z.union([
    Scope3UpdateInputObjectSchema,
    Scope3UncheckedUpdateInputObjectSchema,
  ]),
  where: Scope3WhereUniqueInputObjectSchema,
})
