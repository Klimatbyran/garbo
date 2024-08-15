import { z } from 'zod'
import { Scope3CategoryUpdateInputObjectSchema } from './objects/Scope3CategoryUpdateInput.schema'
import { Scope3CategoryUncheckedUpdateInputObjectSchema } from './objects/Scope3CategoryUncheckedUpdateInput.schema'
import { Scope3CategoryWhereUniqueInputObjectSchema } from './objects/Scope3CategoryWhereUniqueInput.schema'

export const Scope3CategoryUpdateOneSchema = z.object({
  data: z.union([
    Scope3CategoryUpdateInputObjectSchema,
    Scope3CategoryUncheckedUpdateInputObjectSchema,
  ]),
  where: Scope3CategoryWhereUniqueInputObjectSchema,
})
