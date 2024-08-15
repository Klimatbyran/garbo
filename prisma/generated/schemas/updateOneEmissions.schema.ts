import { z } from 'zod'
import { EmissionsUpdateInputObjectSchema } from './objects/EmissionsUpdateInput.schema'
import { EmissionsUncheckedUpdateInputObjectSchema } from './objects/EmissionsUncheckedUpdateInput.schema'
import { EmissionsWhereUniqueInputObjectSchema } from './objects/EmissionsWhereUniqueInput.schema'

export const EmissionsUpdateOneSchema = z.object({
  data: z.union([
    EmissionsUpdateInputObjectSchema,
    EmissionsUncheckedUpdateInputObjectSchema,
  ]),
  where: EmissionsWhereUniqueInputObjectSchema,
})
