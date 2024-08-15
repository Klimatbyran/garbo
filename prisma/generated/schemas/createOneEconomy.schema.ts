import { z } from 'zod'
import { EconomyCreateInputObjectSchema } from './objects/EconomyCreateInput.schema'
import { EconomyUncheckedCreateInputObjectSchema } from './objects/EconomyUncheckedCreateInput.schema'

export const EconomyCreateOneSchema = z.object({
  data: z.union([
    EconomyCreateInputObjectSchema,
    EconomyUncheckedCreateInputObjectSchema,
  ]),
})
