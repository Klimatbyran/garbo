import { z } from 'zod'

export const EmissionsScalarFieldEnumSchema = z.enum([
  'id',
  'fiscalYearId',
  'scope1Id',
  'scope2Id',
  'scope3Id',
])
