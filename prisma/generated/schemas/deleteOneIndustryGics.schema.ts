import { z } from 'zod'
import { IndustryGicsWhereUniqueInputObjectSchema } from './objects/IndustryGicsWhereUniqueInput.schema'

export const IndustryGicsDeleteOneSchema = z.object({
  where: IndustryGicsWhereUniqueInputObjectSchema,
})
