import { z } from 'zod'

export const MetadataScalarFieldEnumSchema = z.enum([
  'id',
  'url',
  'comment',
  'userId',
  'lastUpdated',
])
