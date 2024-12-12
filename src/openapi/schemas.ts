import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

// Initialize OpenAPI extensions
extendZodWithOpenApi(z)

// Base validation schemas
export const wikidataIdSchema = z.string().regex(/Q\d+/)
export const wikidataIdParamSchema = z.object({ wikidataId: wikidataIdSchema })

export const reportingPeriodBodySchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reportURL: z.string().optional(),
  })
  .refine(({ startDate, endDate }) => startDate.getTime() < endDate.getTime(), {
    message: 'startDate must be earlier than endDate',
  })

// Metadata schema
export const MetadataSchema = z.object({
  comment: z.string().nullable().openapi({ description: 'Comment about the data' }),
  source: z.string().nullable().openapi({ description: 'Source of the data' }),
  updatedAt: z.string().datetime().openapi({ description: 'Last update timestamp' }),
  user: z.object({
    name: z.string().openapi({ description: 'Name of the user who updated the data' })
  }),
  verifiedBy: z.object({
    name: z.string().openapi({ description: 'Name of the user who verified the data' })
  }).nullable(),
  dataOrigin: z.string().nullable().openapi({ description: 'Origin of the data' })
})

// Error schema
export const ErrorSchema = z.object({
  error: z.string().openapi({ description: 'Error message' }),
  details: z.any().nullable().openapi({ description: 'Additional error details' })
})

// Company schema
export const CompanyInputSchema = z.object({
  wikidataId: z.string().regex(/Q\d+/).openapi({ description: 'Wikidata ID of the company' }),
  name: z.string().openapi({ description: 'Company name' }),
  description: z.string().optional().openapi({ description: 'Company description' }),
  url: z.string().url().optional().openapi({ description: 'Company website URL' }),
  internalComment: z.string().optional().openapi({ description: 'Internal comment about the company' })
})

// Base schemas
export const StatedTotalEmissionsSchema = z.object({
  total: z.number().openapi({ description: 'Total emissions value' }),
  unit: z.string().openapi({ description: 'Unit of measurement' }),
  metadata: MetadataSchema
}).optional()

export const BiogenicSchema = z.object({
  total: z.number().openapi({ description: 'Total biogenic emissions' }),
  unit: z.string().openapi({ description: 'Unit of measurement' }),
  metadata: MetadataSchema
}).optional()

// Scope-specific schemas
export const Scope1Schema = z.object({
  total: z.number().openapi({ description: 'Total scope 1 emissions' }),
  unit: z.string().openapi({ description: 'Unit of measurement' }),
  metadata: MetadataSchema
}).optional()

export const Scope2Schema = z.object({
  mb: z.number().optional().openapi({ description: 'Market-based scope 2 emissions' }),
  lb: z.number().optional().openapi({ description: 'Location-based scope 2 emissions' }),
  unknown: z.number().optional().openapi({ description: 'Unspecified scope 2 emissions' }),
  unit: z.string().openapi({ description: 'Unit of measurement' }),
  metadata: z.array(MetadataSchema),
  calculatedTotalEmissions: z.number().openapi({ description: 'Calculated total scope 2 emissions' })
}).refine(
  ({ mb, lb, unknown }) => mb !== undefined || lb !== undefined || unknown !== undefined,
  {
    message: 'At least one property of `mb`, `lb` and `unknown` must be defined if scope2 is provided'
  }
).optional()

export const Scope3CategorySchema = z.object({
  category: z.number().int().min(1).max(16).openapi({ description: 'Scope 3 category number (1-16)' }),
  total: z.number().openapi({ description: 'Total emissions for this category' }),
  unit: z.string().openapi({ description: 'Unit of measurement' }),
  metadata: MetadataSchema
})

export const Scope3Schema = z.object({
  categories: z.array(Scope3CategorySchema).optional(),
  statedTotalEmissions: StatedTotalEmissionsSchema,
  metadata: z.array(MetadataSchema).nullable(),
  calculatedTotalEmissions: z.number().openapi({ description: 'Calculated total scope 3 emissions' })
}).optional()

// Combined emissions schema
export const EmissionsSchema = z.object({
  scope1: Scope1Schema,
  scope2: Scope2Schema,
  scope3: Scope3Schema,
  biogenicEmissions: BiogenicSchema,
  statedTotalEmissions: StatedTotalEmissionsSchema,
  calculatedTotalEmissions: z.number().openapi({ description: 'Total calculated emissions across all scopes' })
}).optional()

// Economy schemas
export const TurnoverSchema = z.object({
  value: z.number().optional().openapi({ description: 'Turnover value' }),
  currency: z.string().optional().openapi({ description: 'Currency code' }),
  metadata: MetadataSchema
}).optional()

export const EmployeesSchema = z.object({
  value: z.number().optional().openapi({ description: 'Number of employees' }),
  unit: z.string().nullable().openapi({ description: 'Unit of measurement' }),
  metadata: MetadataSchema
}).optional()

export const EconomySchema = z.object({
  turnover: TurnoverSchema,
  employees: EmployeesSchema
}).optional()

// Industry schemas
export const IndustryGicsSchema = z.object({
  sectorCode: z.string().openapi({ description: 'GICS sector code' }),
  groupCode: z.string().openapi({ description: 'GICS group code' }),
  industryCode: z.string().openapi({ description: 'GICS industry code' }),
  subIndustryCode: z.string().openapi({ description: 'GICS sub-industry code' }),
  sv: z.object({
    sectorName: z.string(),
    groupName: z.string(),
    industryName: z.string(),
    subIndustryName: z.string(),
    subIndustryDescription: z.string()
  }),
  en: z.object({
    sectorName: z.string(),
    groupName: z.string(),
    industryName: z.string(),
    subIndustryName: z.string(),
    subIndustryDescription: z.string()
  })
})

export const IndustrySchema = z.object({
  industryGics: IndustryGicsSchema,
  metadata: MetadataSchema
})

// Goals schema
export const GoalSchema = z.object({
  description: z.string().openapi({ description: 'Goal description' }),
  year: z.string().optional().openapi({ description: 'Target year' }),
  baseYear: z.string().optional().openapi({ description: 'Base year' }),
  target: z.number().optional().openapi({ description: 'Target value' }),
  metadata: MetadataSchema
})

// Initiatives schema
export const InitiativeSchema = z.object({
  title: z.string().openapi({ description: 'Initiative title' }),
  description: z.string().optional().openapi({ description: 'Initiative description' }),
  year: z.string().optional().openapi({ description: 'Initiative year' }),
  scope: z.string().optional().openapi({ description: 'Affected scopes' }),
  metadata: MetadataSchema
})

// Reporting period schema
export const ReportingPeriodSchema = z.object({
  startDate: z.string().datetime().openapi({ description: 'Start date of reporting period' }),
  endDate: z.string().datetime().openapi({ description: 'End date of reporting period' }),
  reportURL: z.string().optional().openapi({ description: 'URL to the report' }),
  emissions: EmissionsSchema,
  economy: EconomySchema,
  metadata: z.array(MetadataSchema).nullable()
})

// Complete company schema
export const CompanySchema = CompanyInputSchema.extend({
  reportingPeriods: z.array(ReportingPeriodSchema),
  industry: IndustrySchema.optional(),
  goals: z.array(GoalSchema).optional(),
  initiatives: z.array(InitiativeSchema).optional()
})
