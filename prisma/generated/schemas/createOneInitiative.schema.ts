import { z } from 'zod'
import { InitiativeCreateInputObjectSchema } from './objects/InitiativeCreateInput.schema'
import { InitiativeUncheckedCreateInputObjectSchema } from './objects/InitiativeUncheckedCreateInput.schema'

export const InitiativeCreateOneSchema = z.object({
  data: z.union([
    InitiativeCreateInputObjectSchema,
    InitiativeUncheckedCreateInputObjectSchema,
  ]),
})
