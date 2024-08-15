import { z } from 'zod'
import { IndustryGicsUpdateManyMutationInputObjectSchema } from './objects/IndustryGicsUpdateManyMutationInput.schema'
import { IndustryGicsWhereInputObjectSchema } from './objects/IndustryGicsWhereInput.schema'

export const IndustryGicsUpdateManySchema = z.object({
  data: IndustryGicsUpdateManyMutationInputObjectSchema,
  where: IndustryGicsWhereInputObjectSchema.optional(),
})
