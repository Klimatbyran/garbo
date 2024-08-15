import { z } from 'zod'
import { EmissionsWhereUniqueInputObjectSchema } from './objects/EmissionsWhereUniqueInput.schema'

export const EmissionsFindUniqueSchema = z.object({
  where: EmissionsWhereUniqueInputObjectSchema,
})
