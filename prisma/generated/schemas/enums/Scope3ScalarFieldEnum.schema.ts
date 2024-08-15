import { z } from 'zod'

export const Scope3ScalarFieldEnumSchema = z.enum([
  'id',
  'value',
  'biogenic',
  'unit',
  'baseYear',
  'metadataId',
  'emissionsId',
])
