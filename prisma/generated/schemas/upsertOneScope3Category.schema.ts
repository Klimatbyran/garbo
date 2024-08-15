import { z } from 'zod'
import { Scope3CategoryWhereUniqueInputObjectSchema } from './objects/Scope3CategoryWhereUniqueInput.schema'
import { Scope3CategoryCreateInputObjectSchema } from './objects/Scope3CategoryCreateInput.schema'
import { Scope3CategoryUncheckedCreateInputObjectSchema } from './objects/Scope3CategoryUncheckedCreateInput.schema'
import { Scope3CategoryUpdateInputObjectSchema } from './objects/Scope3CategoryUpdateInput.schema'
import { Scope3CategoryUncheckedUpdateInputObjectSchema } from './objects/Scope3CategoryUncheckedUpdateInput.schema'

export const Scope3CategoryUpsertSchema = z.object({
  where: Scope3CategoryWhereUniqueInputObjectSchema,
  create: z.union([
    Scope3CategoryCreateInputObjectSchema,
    Scope3CategoryUncheckedCreateInputObjectSchema,
  ]),
  update: z.union([
    Scope3CategoryUpdateInputObjectSchema,
    Scope3CategoryUncheckedUpdateInputObjectSchema,
  ]),
})
