import { z } from 'zod'
import { EconomyWhereUniqueInputObjectSchema } from './objects/EconomyWhereUniqueInput.schema'

export const EconomyFindUniqueSchema = z.object({
  where: EconomyWhereUniqueInputObjectSchema,
})
