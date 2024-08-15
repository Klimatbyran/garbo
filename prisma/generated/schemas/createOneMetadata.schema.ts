import { z } from 'zod'
import { MetadataCreateInputObjectSchema } from './objects/MetadataCreateInput.schema'
import { MetadataUncheckedCreateInputObjectSchema } from './objects/MetadataUncheckedCreateInput.schema'

export const MetadataCreateOneSchema = z.object({
  data: z.union([
    MetadataCreateInputObjectSchema,
    MetadataUncheckedCreateInputObjectSchema,
  ]),
})
