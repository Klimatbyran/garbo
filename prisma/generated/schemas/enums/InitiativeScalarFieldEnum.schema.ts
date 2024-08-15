import { z } from 'zod'

export const InitiativeScalarFieldEnumSchema = z.enum([
  'id',
  'title',
  'description',
  'year',
  'scope',
  'companyId',
  'metadataId',
])
