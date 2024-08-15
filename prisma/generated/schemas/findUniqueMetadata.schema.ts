import { z } from 'zod'
import { MetadataWhereUniqueInputObjectSchema } from './objects/MetadataWhereUniqueInput.schema'

export const MetadataFindUniqueSchema = z.object({
  where: MetadataWhereUniqueInputObjectSchema,
})
