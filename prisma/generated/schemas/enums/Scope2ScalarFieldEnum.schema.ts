import { z } from 'zod'

export const Scope2ScalarFieldEnumSchema = z.enum([
  'id',
  'value',
  'biogenic',
  'unit',
  'mb',
  'lb',
  'baseYear',
  'metadataId',
  'emissionsId',
])
