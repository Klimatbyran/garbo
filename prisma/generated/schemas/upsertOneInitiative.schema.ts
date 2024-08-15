import { z } from 'zod'
import { InitiativeWhereUniqueInputObjectSchema } from './objects/InitiativeWhereUniqueInput.schema'
import { InitiativeCreateInputObjectSchema } from './objects/InitiativeCreateInput.schema'
import { InitiativeUncheckedCreateInputObjectSchema } from './objects/InitiativeUncheckedCreateInput.schema'
import { InitiativeUpdateInputObjectSchema } from './objects/InitiativeUpdateInput.schema'
import { InitiativeUncheckedUpdateInputObjectSchema } from './objects/InitiativeUncheckedUpdateInput.schema'

export const InitiativeUpsertSchema = z.object({
  where: InitiativeWhereUniqueInputObjectSchema,
  create: z.union([
    InitiativeCreateInputObjectSchema,
    InitiativeUncheckedCreateInputObjectSchema,
  ]),
  update: z.union([
    InitiativeUpdateInputObjectSchema,
    InitiativeUncheckedUpdateInputObjectSchema,
  ]),
})
