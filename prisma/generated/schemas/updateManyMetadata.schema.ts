import { z } from 'zod'
import { MetadataUpdateManyMutationInputObjectSchema } from './objects/MetadataUpdateManyMutationInput.schema'
import { MetadataWhereInputObjectSchema } from './objects/MetadataWhereInput.schema'

export const MetadataUpdateManySchema = z.object({
  data: MetadataUpdateManyMutationInputObjectSchema,
  where: MetadataWhereInputObjectSchema.optional(),
})
