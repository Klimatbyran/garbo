import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

export const registry = new OpenAPIRegistry()

// Register common schemas
export const ErrorSchema = registry.register(
  'Error',
  z.object({
    error: z.string(),
    details: z.object({}).nullable(),
  }).openapi('Error')
)

// Register company schemas
export const CompanyInputSchema = registry.register(
  'CompanyInput',
  z.object({
    wikidataId: z.string().regex(/Q\d+/),
    name: z.string(),
    description: z.string().optional(),
    url: z.string().url().optional(),
    internalComment: z.string().optional(),
  }).openapi('CompanyInput')
)

export const CompanySchema = registry.register(
  'Company',
  CompanyInputSchema.extend({
    // Add additional fields that are returned by the API
  }).openapi('Company')
)
