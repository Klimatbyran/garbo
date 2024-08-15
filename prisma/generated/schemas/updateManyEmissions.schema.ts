import { z } from 'zod'
import { EmissionsUpdateManyMutationInputObjectSchema } from './objects/EmissionsUpdateManyMutationInput.schema'
import { EmissionsWhereInputObjectSchema } from './objects/EmissionsWhereInput.schema'

export const EmissionsUpdateManySchema = z.object({
  data: EmissionsUpdateManyMutationInputObjectSchema,
  where: EmissionsWhereInputObjectSchema.optional(),
})
