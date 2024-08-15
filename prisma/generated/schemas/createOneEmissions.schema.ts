import { z } from 'zod'
import { EmissionsCreateInputObjectSchema } from './objects/EmissionsCreateInput.schema'
import { EmissionsUncheckedCreateInputObjectSchema } from './objects/EmissionsUncheckedCreateInput.schema'

export const EmissionsCreateOneSchema = z.object({
  data: z.union([
    EmissionsCreateInputObjectSchema,
    EmissionsUncheckedCreateInputObjectSchema,
  ]),
})
