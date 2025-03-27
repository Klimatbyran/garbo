import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

export const wikidataIdSchema = z.string().regex(/Q\d+/)

export const wikidataIdParamSchema = z.object({ wikidataId: wikidataIdSchema })

export const companySearchQuerySchema = z.object({q: z.string()})

export const garboEntityIdSchema = z.object({ id: z.string() })

/**
 * This allows reporting periods like 2022-2023
 */
export const yearSchema = z.string().regex(/\d{4}(?:-\d{4})?/)

export const yearParamSchema = z.object({ year: yearSchema })

export const errorSchema = z.object({
  code: z.string().openapi('Error code'),
  message: z.string().optional().openapi('Error message'),
  details: z.any().optional(),
})

type ErrorCode = 400 | 401 | 404;

export function getErrorSchemas(...codes: ErrorCode[]) {
  return codes.reduce((acc, code) => {
    acc[code] = errorSchema
    return acc
  }, {} as Record<ErrorCode, typeof errorSchema>)
}

const validEmissionsUnits = z.enum(['tCO2e', 'tCO2'])

export const emissionUnitSchemaGarbo = validEmissionsUnits.nullable()

export const emissionUnitSchemaWithDefault =
  validEmissionsUnits.default('tCO2e')
