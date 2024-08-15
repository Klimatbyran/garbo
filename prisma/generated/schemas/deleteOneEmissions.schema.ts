import { z } from 'zod'
import { EmissionsWhereUniqueInputObjectSchema } from './objects/EmissionsWhereUniqueInput.schema'

export const EmissionsDeleteOneSchema = z.object({
  where: EmissionsWhereUniqueInputObjectSchema,
})
