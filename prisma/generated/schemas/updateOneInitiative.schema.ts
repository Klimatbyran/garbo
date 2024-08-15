import { z } from 'zod'
import { InitiativeUpdateInputObjectSchema } from './objects/InitiativeUpdateInput.schema'
import { InitiativeUncheckedUpdateInputObjectSchema } from './objects/InitiativeUncheckedUpdateInput.schema'
import { InitiativeWhereUniqueInputObjectSchema } from './objects/InitiativeWhereUniqueInput.schema'

export const InitiativeUpdateOneSchema = z.object({
  data: z.union([
    InitiativeUpdateInputObjectSchema,
    InitiativeUncheckedUpdateInputObjectSchema,
  ]),
  where: InitiativeWhereUniqueInputObjectSchema,
})
