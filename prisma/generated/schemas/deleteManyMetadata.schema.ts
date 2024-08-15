import { z } from 'zod'
import { MetadataWhereInputObjectSchema } from './objects/MetadataWhereInput.schema'

export const MetadataDeleteManySchema = z.object({
  where: MetadataWhereInputObjectSchema.optional(),
})
