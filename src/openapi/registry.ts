import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

// Initialize OpenAPI registry
extendZodWithOpenApi(z)
export const registry = new OpenAPIRegistry()

// Register common schemas
export const ErrorSchema = registry.register(
  'Error',
  z.object({
    error: z.string().openapi({ description: 'Error message' }),
    details: z.object({}).nullable().openapi({ description: 'Additional error details' }),
  })
)

// Register company schemas
export const CompanyInputSchema = registry.register(
  'CompanyInput',
  z.object({
    wikidataId: z.string().regex(/Q\d+/).openapi({ description: 'Wikidata ID of the company' }),
    name: z.string().openapi({ description: 'Company name' }),
    description: z.string().optional().openapi({ description: 'Company description' }),
    url: z.string().url().optional().openapi({ description: 'Company website URL' }),
    internalComment: z.string().optional().openapi({ description: 'Internal notes about the company' }),
  })
)

export const CompanySchema = registry.register(
  'Company',
  CompanyInputSchema.extend({
    // Add additional fields that are returned by the API
  })
)
