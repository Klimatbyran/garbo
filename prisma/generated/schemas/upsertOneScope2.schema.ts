import { z } from 'zod'
import { Scope2WhereUniqueInputObjectSchema } from './objects/Scope2WhereUniqueInput.schema'
import { Scope2CreateInputObjectSchema } from './objects/Scope2CreateInput.schema'
import { Scope2UncheckedCreateInputObjectSchema } from './objects/Scope2UncheckedCreateInput.schema'
import { Scope2UpdateInputObjectSchema } from './objects/Scope2UpdateInput.schema'
import { Scope2UncheckedUpdateInputObjectSchema } from './objects/Scope2UncheckedUpdateInput.schema'

export const Scope2UpsertSchema = z.object({
  where: Scope2WhereUniqueInputObjectSchema,
  create: z.union([
    Scope2CreateInputObjectSchema,
    Scope2UncheckedCreateInputObjectSchema,
  ]),
  update: z.union([
    Scope2UpdateInputObjectSchema,
    Scope2UncheckedUpdateInputObjectSchema,
  ]),
})
