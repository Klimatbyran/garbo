import { z } from 'zod'
import { IndustryGicsWhereInputObjectSchema } from './objects/IndustryGicsWhereInput.schema'

export const IndustryGicsDeleteManySchema = z.object({
  where: IndustryGicsWhereInputObjectSchema.optional(),
})
