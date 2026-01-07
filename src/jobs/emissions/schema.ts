import { z } from 'zod'

export const issueSchema = z.object({
  type: z.enum(['MISSING_DATA', 'CALCULATION_ERROR', 'SCOPE_MISSING', 'UNIT_ERROR', 'OTHER', 'UNREASONABLE_REDUCTION']),
  description: z.string(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  suggestedAction: z.string().optional(),
  reportedNumber: z.number().optional(),
  correctNumber: z.number().optional(),
  yearComparison: z.object({
    previousYear: z.string(),
    currentYear: z.string(),
    reduction: z.number()
  }).optional()
})

export const nextStepSchema = z.object({
  type: z.enum(['VERIFY_CALCULATION', 'REQUEST_SCOPE3', 'CLARIFY_UNITS', 'OTHER']),
  description: z.string(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH'])
})

export const assessmentSchema = z.object({
  isReasonable: z.boolean(),
  confidence: z.number(),
  issues: z.array(issueSchema),
  reasoning: z.string(),
  nextSteps: z.array(nextStepSchema)
})

export const assessmentResultSchema = z.object({
  assessment: assessmentSchema
})

export const errorResponseSchema = z.object({
  code: z.string(),
  message: z.string()
})

export const emissionsAssessmentResponseSchema = z.object({
  200: assessmentResultSchema,
  400: errorResponseSchema,
  500: errorResponseSchema
}) 