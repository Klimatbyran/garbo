import { z } from 'zod'
import { IndustryGicsCreateInputObjectSchema } from './objects/IndustryGicsCreateInput.schema'
import { IndustryGicsUncheckedCreateInputObjectSchema } from './objects/IndustryGicsUncheckedCreateInput.schema'

export const IndustryGicsCreateOneSchema = z.object({
  data: z.union([
    IndustryGicsCreateInputObjectSchema,
    IndustryGicsUncheckedCreateInputObjectSchema,
  ]),
})
