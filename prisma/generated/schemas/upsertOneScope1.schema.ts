import { z } from 'zod'
import { Scope1WhereUniqueInputObjectSchema } from './objects/Scope1WhereUniqueInput.schema'
import { Scope1CreateInputObjectSchema } from './objects/Scope1CreateInput.schema'
import { Scope1UncheckedCreateInputObjectSchema } from './objects/Scope1UncheckedCreateInput.schema'
import { Scope1UpdateInputObjectSchema } from './objects/Scope1UpdateInput.schema'
import { Scope1UncheckedUpdateInputObjectSchema } from './objects/Scope1UncheckedUpdateInput.schema'

export const Scope1UpsertSchema = z.object({
  where: Scope1WhereUniqueInputObjectSchema,
  create: z.union([
    Scope1CreateInputObjectSchema,
    Scope1UncheckedCreateInputObjectSchema,
  ]),
  update: z.union([
    Scope1UpdateInputObjectSchema,
    Scope1UncheckedUpdateInputObjectSchema,
  ]),
})
