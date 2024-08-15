import { z } from 'zod'
import { EconomyWhereUniqueInputObjectSchema } from './objects/EconomyWhereUniqueInput.schema'
import { EconomyCreateInputObjectSchema } from './objects/EconomyCreateInput.schema'
import { EconomyUncheckedCreateInputObjectSchema } from './objects/EconomyUncheckedCreateInput.schema'
import { EconomyUpdateInputObjectSchema } from './objects/EconomyUpdateInput.schema'
import { EconomyUncheckedUpdateInputObjectSchema } from './objects/EconomyUncheckedUpdateInput.schema'

export const EconomyUpsertSchema = z.object({
  where: EconomyWhereUniqueInputObjectSchema,
  create: z.union([
    EconomyCreateInputObjectSchema,
    EconomyUncheckedCreateInputObjectSchema,
  ]),
  update: z.union([
    EconomyUpdateInputObjectSchema,
    EconomyUncheckedUpdateInputObjectSchema,
  ]),
})
