import { z } from 'zod'
import { MetadataWhereUniqueInputObjectSchema } from './objects/MetadataWhereUniqueInput.schema'

export const MetadataDeleteOneSchema = z.object({
  where: MetadataWhereUniqueInputObjectSchema,
})
