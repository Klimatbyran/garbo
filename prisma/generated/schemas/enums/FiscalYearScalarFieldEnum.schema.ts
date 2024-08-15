import { z } from 'zod'

export const FiscalYearScalarFieldEnumSchema = z.enum([
  'id',
  'startYear',
  'endYear',
  'startMonth',
  'companyId',
  'emissionsId',
])
