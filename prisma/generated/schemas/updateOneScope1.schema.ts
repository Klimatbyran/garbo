import { z } from 'zod'
import { Scope1UpdateInputObjectSchema } from './objects/Scope1UpdateInput.schema'
import { Scope1UncheckedUpdateInputObjectSchema } from './objects/Scope1UncheckedUpdateInput.schema'
import { Scope1WhereUniqueInputObjectSchema } from './objects/Scope1WhereUniqueInput.schema'

export const Scope1UpdateOneSchema = z.object({
  data: z.union([
    Scope1UpdateInputObjectSchema,
    Scope1UncheckedUpdateInputObjectSchema,
  ]),
  where: Scope1WhereUniqueInputObjectSchema,
})
