import { z } from 'zod'
import { EconomyWhereUniqueInputObjectSchema } from './objects/EconomyWhereUniqueInput.schema'

export const EconomyDeleteOneSchema = z.object({
  where: EconomyWhereUniqueInputObjectSchema,
})
