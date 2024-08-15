import { z } from 'zod'

export const Scope1ScalarFieldEnumSchema = z.enum([
  'id',
  'value',
  'biogenic',
  'unit',
  'baseYear',
  'metadataId',
  'emissionsId',
])
