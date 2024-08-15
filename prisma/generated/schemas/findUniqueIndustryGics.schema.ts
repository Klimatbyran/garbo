import { z } from 'zod'
import { IndustryGicsWhereUniqueInputObjectSchema } from './objects/IndustryGicsWhereUniqueInput.schema'

export const IndustryGicsFindUniqueSchema = z.object({
  where: IndustryGicsWhereUniqueInputObjectSchema,
})
