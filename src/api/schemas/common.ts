import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

export const wikidataIdSchema = z.string().regex(/Q\d+/)

export const companyIdSchema = z.string().uuid()

export const wikidataIdParamSchema = z.object({ wikidataId: wikidataIdSchema })

/** Staff mutation routes: internal UUID only. */
export const companyIdParamSchema = z.object({ id: companyIdSchema })

/** Pipeline read: wikidataId, full UUID, or 8-char UUID prefix. */
export const companyUrlIdentifierSchema = z.union([
  wikidataIdSchema,
  companyIdSchema,
  // Runtime accepts upper/lower hex; OpenAPI pattern stays lowercase-only.
  // Zod 4 would otherwise emit `$/i` in the generated pattern.
  z
    .string()
    .regex(/^[0-9a-fA-F]{8}$/)
    .openapi({ pattern: '^[0-9a-f]{8}$' }),
])

export const companyIdentifierParamSchema = z.object({
  wikidataId: companyUrlIdentifierSchema,
})

export const companyGoalParamsSchema = z.object({
  id: companyIdSchema,
  goalId: z.string(),
})

export const companyInitiativeParamsSchema = z.object({
  id: companyIdSchema,
  initiativeId: z.string(),
})

/** Lightweight pipeline company search hit (id + name only). */
export const pipelineCompanySearchHitSchema = z.object({
  id: companyIdSchema,
  name: z.string(),
  wikidataId: wikidataIdSchema.nullable().optional(),
  lei: z.string().nullable().optional(),
  alternativeNames: z.array(z.string()).optional(),
})

export const pipelineCompanySearchListSchema = z.array(
  pipelineCompanySearchHitSchema
)

export const companySearchQuerySchema = z.object({ q: z.string() })

export const garboEntityIdSchema = z.object({ id: z.string() })

export const errorSchema = z.object({
  code: z.string().openapi('Error code'),
  message: z.string().optional().openapi('Error message'),
  details: z.any().optional(),
})

type ErrorCode = 400 | 401 | 404 | 409 | 500

export function getErrorSchemas(...codes: ErrorCode[]) {
  return codes.reduce(
    (acc, code) => {
      acc[code] = errorSchema
      return acc
    },
    {} as Record<ErrorCode, typeof errorSchema>
  )
}

const validEmissionsUnits = z.enum(['tCO2e', 'tCO2'])

/**
 * Nullable unit. Zod 4 + zod-to-openapi 8 would emit `enum: […, null]`; pin the
 * OpenAPI 3.0 shape (`enum` without null + `nullable: true`).
 * `as any`: OpenAPI 3.1 typings omit `nullable`.
 */
export const emissionUnitSchemaGarbo = validEmissionsUnits.nullable().openapi({
  type: 'string',
  enum: ['tCO2e', 'tCO2'],
  nullable: true,
} as any)

export const emissionUnitSchemaWithDefault =
  validEmissionsUnits.default('tCO2e')

export const goalTargetTypeSchema = z.enum([
  'ABSOLUTE',
  'INTENSITY',
  'NET_ZERO',
  'CLIMATE_NEUTRAL',
  'OTHER',
])

export const goalHorizonSchema = z.enum(['NEAR_TERM', 'LONG_TERM'])

export const goalTargetDirectionSchema = z.enum(['REDUCE_BY', 'REACH_LEVEL'])

export const goalBaseYearSourceSchema = z.enum([
  'STATED_FOR_GOAL',
  'COMPANY_BASE_YEAR',
  'REPORT_YEAR',
  'NOT_STATED',
])
