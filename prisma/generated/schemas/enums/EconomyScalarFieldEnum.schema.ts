import { z } from 'zod'

export const EconomyScalarFieldEnumSchema = z.enum([
  'id',
  'turnover',
  'unit',
  'employees',
  'metadataId',
  'fiscalYearId',
])
