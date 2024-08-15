import { z } from 'zod'
import { MetadataUpdateInputObjectSchema } from './objects/MetadataUpdateInput.schema'
import { MetadataUncheckedUpdateInputObjectSchema } from './objects/MetadataUncheckedUpdateInput.schema'
import { MetadataWhereUniqueInputObjectSchema } from './objects/MetadataWhereUniqueInput.schema'

export const MetadataUpdateOneSchema = z.object({
  data: z.union([
    MetadataUpdateInputObjectSchema,
    MetadataUncheckedUpdateInputObjectSchema,
  ]),
  where: MetadataWhereUniqueInputObjectSchema,
})
