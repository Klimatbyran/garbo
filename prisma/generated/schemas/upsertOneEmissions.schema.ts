import { z } from 'zod'
import { EmissionsWhereUniqueInputObjectSchema } from './objects/EmissionsWhereUniqueInput.schema'
import { EmissionsCreateInputObjectSchema } from './objects/EmissionsCreateInput.schema'
import { EmissionsUncheckedCreateInputObjectSchema } from './objects/EmissionsUncheckedCreateInput.schema'
import { EmissionsUpdateInputObjectSchema } from './objects/EmissionsUpdateInput.schema'
import { EmissionsUncheckedUpdateInputObjectSchema } from './objects/EmissionsUncheckedUpdateInput.schema'

export const EmissionsUpsertSchema = z.object({
  where: EmissionsWhereUniqueInputObjectSchema,
  create: z.union([
    EmissionsCreateInputObjectSchema,
    EmissionsUncheckedCreateInputObjectSchema,
  ]),
  update: z.union([
    EmissionsUpdateInputObjectSchema,
    EmissionsUncheckedUpdateInputObjectSchema,
  ]),
})
