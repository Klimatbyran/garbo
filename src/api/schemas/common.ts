import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

export const wikidataIdSchema = z.string().regex(/Q\d+/)

export const wikidataIdParamSchema = z.object({ wikidataId: wikidataIdSchema })

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

const errorCodes = [400, 404] as const

export function getErrorSchemas(...codes: (typeof errorCodes)[number][]) {
  return codes.reduce((acc, code) => {
    acc[code] = errorSchema
    return acc
  }, {})
}
