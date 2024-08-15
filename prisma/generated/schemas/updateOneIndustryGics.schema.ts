import { z } from 'zod'
import { IndustryGicsUpdateInputObjectSchema } from './objects/IndustryGicsUpdateInput.schema'
import { IndustryGicsUncheckedUpdateInputObjectSchema } from './objects/IndustryGicsUncheckedUpdateInput.schema'
import { IndustryGicsWhereUniqueInputObjectSchema } from './objects/IndustryGicsWhereUniqueInput.schema'

export const IndustryGicsUpdateOneSchema = z.object({
  data: z.union([
    IndustryGicsUpdateInputObjectSchema,
    IndustryGicsUncheckedUpdateInputObjectSchema,
  ]),
  where: IndustryGicsWhereUniqueInputObjectSchema,
})
