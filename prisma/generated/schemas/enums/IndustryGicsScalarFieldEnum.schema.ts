import { z } from 'zod'

export const IndustryGicsScalarFieldEnumSchema = z.enum([
  'id',
  'name',
  'sectorCode',
  'sectorName',
  'groupCode',
  'groupName',
  'industryCode',
  'industryName',
  'subIndustryCode',
  'subIndustryName',
])
