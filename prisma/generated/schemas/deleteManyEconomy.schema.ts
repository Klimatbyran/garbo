import { z } from 'zod'
import { EconomyWhereInputObjectSchema } from './objects/EconomyWhereInput.schema'

export const EconomyDeleteManySchema = z.object({
  where: EconomyWhereInputObjectSchema.optional(),
})
