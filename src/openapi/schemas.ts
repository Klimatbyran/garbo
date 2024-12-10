import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

// Initialize OpenAPI extensions
extendZodWithOpenApi(z)

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
  total: z.number().openapi({ description: 'Total emissions value' })
}).optional()

export const BiogenicSchema = z.object({
  total: z.number().openapi({ description: 'Total biogenic emissions' })
}).optional()

// Scope-specific schemas
export const Scope1Schema = z.object({
  total: z.number().openapi({ description: 'Total scope 1 emissions' })
}).optional()

export const Scope2Schema = z.object({
  mb: z.number().optional().openapi({ description: 'Market-based scope 2 emissions' }),
  lb: z.number().optional().openapi({ description: 'Location-based scope 2 emissions' }),
  unknown: z.number().optional().openapi({ description: 'Unspecified scope 2 emissions' })
}).refine(
  ({ mb, lb, unknown }) => mb !== undefined || lb !== undefined || unknown !== undefined,
  {
    message: 'At least one property of `mb`, `lb` and `unknown` must be defined if scope2 is provided'
  }
).optional()

export const Scope3CategorySchema = z.object({
  category: z.number().int().min(1).max(16).openapi({ description: 'Scope 3 category number (1-16)' }),
  total: z.number().openapi({ description: 'Total emissions for this category' })
})

export const Scope3Schema = z.object({
  categories: z.array(Scope3CategorySchema).optional(),
  statedTotalEmissions: StatedTotalEmissionsSchema
}).optional()

// Combined emissions schema
export const EmissionsSchema = z.object({
  scope1: Scope1Schema,
  scope2: Scope2Schema,
  scope3: Scope3Schema,
  biogenic: BiogenicSchema,
  statedTotalEmissions: StatedTotalEmissionsSchema
}).optional()

// Economy schemas
export const TurnoverSchema = z.object({
  value: z.number().optional().openapi({ description: 'Turnover value' }),
  currency: z.string().optional().openapi({ description: 'Currency code' })
}).optional()

export const EmployeesSchema = z.object({
  value: z.number().optional().openapi({ description: 'Number of employees' }),
  unit: z.string().optional().openapi({ description: 'Unit of measurement' })
}).optional()

export const EconomySchema = z.object({
  turnover: TurnoverSchema,
  employees: EmployeesSchema
}).optional()
