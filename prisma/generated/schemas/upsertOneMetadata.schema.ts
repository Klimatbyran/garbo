import { z } from 'zod'
import { MetadataWhereUniqueInputObjectSchema } from './objects/MetadataWhereUniqueInput.schema'
import { MetadataCreateInputObjectSchema } from './objects/MetadataCreateInput.schema'
import { MetadataUncheckedCreateInputObjectSchema } from './objects/MetadataUncheckedCreateInput.schema'
import { MetadataUpdateInputObjectSchema } from './objects/MetadataUpdateInput.schema'
import { MetadataUncheckedUpdateInputObjectSchema } from './objects/MetadataUncheckedUpdateInput.schema'

export const MetadataUpsertSchema = z.object({
  where: MetadataWhereUniqueInputObjectSchema,
  create: z.union([
    MetadataCreateInputObjectSchema,
    MetadataUncheckedCreateInputObjectSchema,
  ]),
  update: z.union([
    MetadataUpdateInputObjectSchema,
    MetadataUncheckedUpdateInputObjectSchema,
  ]),
})
