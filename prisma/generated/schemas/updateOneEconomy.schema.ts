import { z } from 'zod'
import { EconomyUpdateInputObjectSchema } from './objects/EconomyUpdateInput.schema'
import { EconomyUncheckedUpdateInputObjectSchema } from './objects/EconomyUncheckedUpdateInput.schema'
import { EconomyWhereUniqueInputObjectSchema } from './objects/EconomyWhereUniqueInput.schema'

export const EconomyUpdateOneSchema = z.object({
  data: z.union([
    EconomyUpdateInputObjectSchema,
    EconomyUncheckedUpdateInputObjectSchema,
  ]),
  where: EconomyWhereUniqueInputObjectSchema,
})
