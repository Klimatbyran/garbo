import { z } from 'zod'

export const Scope3CategoryScalarFieldEnumSchema = z.enum([
  'id',
  'category',
  'value',
  'scope3Id',
  'metadataId',
])
