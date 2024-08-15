import { z } from 'zod'

export const CompanyScalarFieldEnumSchema = z.enum([
  'id',
  'name',
  'description',
  'wikidataId',
  'url',
  'industryGicsId',
])
