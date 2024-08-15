import { z } from 'zod'

export const GoalScalarFieldEnumSchema = z.enum([
  'id',
  'description',
  'year',
  'target',
  'baseYear',
  'metadataId',
  'companyId',
])
