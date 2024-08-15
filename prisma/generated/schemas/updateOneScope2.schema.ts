import { z } from 'zod'
import { Scope2UpdateInputObjectSchema } from './objects/Scope2UpdateInput.schema'
import { Scope2UncheckedUpdateInputObjectSchema } from './objects/Scope2UncheckedUpdateInput.schema'
import { Scope2WhereUniqueInputObjectSchema } from './objects/Scope2WhereUniqueInput.schema'

export const Scope2UpdateOneSchema = z.object({
  data: z.union([
    Scope2UpdateInputObjectSchema,
    Scope2UncheckedUpdateInputObjectSchema,
  ]),
  where: Scope2WhereUniqueInputObjectSchema,
})
