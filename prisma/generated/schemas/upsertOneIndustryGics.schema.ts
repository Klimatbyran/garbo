import { z } from 'zod'
import { IndustryGicsWhereUniqueInputObjectSchema } from './objects/IndustryGicsWhereUniqueInput.schema'
import { IndustryGicsCreateInputObjectSchema } from './objects/IndustryGicsCreateInput.schema'
import { IndustryGicsUncheckedCreateInputObjectSchema } from './objects/IndustryGicsUncheckedCreateInput.schema'
import { IndustryGicsUpdateInputObjectSchema } from './objects/IndustryGicsUpdateInput.schema'
import { IndustryGicsUncheckedUpdateInputObjectSchema } from './objects/IndustryGicsUncheckedUpdateInput.schema'

export const IndustryGicsUpsertSchema = z.object({
  where: IndustryGicsWhereUniqueInputObjectSchema,
  create: z.union([
    IndustryGicsCreateInputObjectSchema,
    IndustryGicsUncheckedCreateInputObjectSchema,
  ]),
  update: z.union([
    IndustryGicsUpdateInputObjectSchema,
    IndustryGicsUncheckedUpdateInputObjectSchema,
  ]),
})
