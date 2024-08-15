import { z } from 'zod'
import { EmissionsWhereInputObjectSchema } from './objects/EmissionsWhereInput.schema'

export const EmissionsDeleteManySchema = z.object({
  where: EmissionsWhereInputObjectSchema.optional(),
})
