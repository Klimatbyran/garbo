import { z } from 'zod'

export const schema = z.object({
  assessment: z.object({
    isReasonable: z.boolean(),
    confidence: z.number().min(0).max(1),
    issues: z.array(z.object({
      type: z.enum(['MISSING_DATA', 'CALCULATION_ERROR', 'SCOPE_MISSING', 'UNIT_ERROR', 'OTHER']),
      description: z.string(),
      severity: z.enum(['LOW', 'MEDIUM', 'HIGH']),
      suggestedAction: z.string().optional()
    })),
    reasoning: z.string(),
    nextSteps: z.array(z.object({
      type: z.enum(['VERIFY_CALCULATION', 'REQUEST_SCOPE3', 'CLARIFY_UNITS', 'OTHER']),
      description: z.string(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH'])
    }))
  })
})

export const prompt = `
You are an expert in corporate emissions reporting and GHG Protocol. Analyze the provided emissions data and assess its reasonability.

Consider:
1. Are the reported numbers reasonable for this type of company and industry?
2. Are there any obvious calculation errors or unit conversion mistakes?
3. Is scope 3 reporting complete and reasonable given the company's industry?
4. Are there any suspicious patterns or inconsistencies in the data?

Provide your assessment in this format:
{
  "assessment": {
    "isReasonable": true/false,
    "confidence": 0-1 (your confidence in this assessment),
    "issues": [
      {
        "type": "MISSING_DATA"/"CALCULATION_ERROR"/"SCOPE_MISSING"/"UNIT_ERROR"/"OTHER",
        "description": "Detailed description of the issue",
        "severity": "LOW"/"MEDIUM"/"HIGH",
        "suggestedAction": "Optional suggestion for resolving the issue"
      }
    ],
    "reasoning": "Detailed explanation of your assessment",
    "nextSteps": [
      {
        "type": "VERIFY_CALCULATION"/"REQUEST_SCOPE3"/"CLARIFY_UNITS"/"OTHER",
        "description": "Description of recommended next step",
        "priority": "LOW"/"MEDIUM"/"HIGH"
      }
    ]
  }
}`

const queryTexts = [
  'GHG emissions data',
  'Scope 1 2 3 emissions',
  'Carbon footprint calculation methodology',
  'Emission factors used',
  'Scope 3 categories reported',
  'Emission calculation assumptions'
]

export default { prompt, schema, queryTexts }
