import { z } from 'zod'
import { Scope3WhereUniqueInputObjectSchema } from './objects/Scope3WhereUniqueInput.schema'
import { Scope3CreateInputObjectSchema } from './objects/Scope3CreateInput.schema'
import { Scope3UncheckedCreateInputObjectSchema } from './objects/Scope3UncheckedCreateInput.schema'
import { Scope3UpdateInputObjectSchema } from './objects/Scope3UpdateInput.schema'
import { Scope3UncheckedUpdateInputObjectSchema } from './objects/Scope3UncheckedUpdateInput.schema'

export const Scope3UpsertSchema = z.object({
  where: Scope3WhereUniqueInputObjectSchema,
  create: z.union([
    Scope3CreateInputObjectSchema,
    Scope3UncheckedCreateInputObjectSchema,
  ]),
  update: z.union([
    Scope3UpdateInputObjectSchema,
    Scope3UncheckedUpdateInputObjectSchema,
  ]),
})
