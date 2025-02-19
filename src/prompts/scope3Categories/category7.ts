import { z } from 'zod'
import { emissionUnitSchemaGarbo } from '../../../api/schemas'

export const schema = z.object({
  analysis: z.object({
    estimatedEmissions: z.object({
      value: z.number(),
      unit: emissionUnitSchemaGarbo,
      confidence: z.number().min(0).max(1),
    }),
    reasoning: z.string(),
    methodology: z.string(),
    dataGaps: z.array(z.string()),
    recommendations: z.array(z.string()),
    relevantFactors: z.array(z.object({
      name: z.string(),
      value: z.string(),
      impact: z.enum(['HIGH', 'MEDIUM', 'LOW'])
    }))
  })
})

export const prompt = `You are an expert in Scope 3 Category 7 (Employee Commuting) emissions calculations.

Analyze the company's employee commuting patterns to estimate Category 7 emissions.

Consider:
1. Number of employees and their commuting patterns
2. Types of transportation used for commuting
3. Average commuting distances
4. Remote work policies and their impact
5. Regional public transportation infrastructure
6. Industry benchmarks for commuting emissions
7. Any partial Category 7 data that may be reported
8. Work from home emissions impact

Provide a detailed analysis including:
1. Estimated emissions with confidence level
2. Reasoning behind the estimate
3. Methodology used
4. Data gaps identified
5. Recommendations for improving data quality
6. Relevant factors that influenced the estimate

Use industry-specific emission factors and benchmarks where appropriate.
Be conservative in estimates and clearly state assumptions.`

const queryTexts = [
  'Employee commuting',
  'Staff transportation',
  'Commuting patterns',
  'Work from home',
  'Remote work policy',
  'Category 7 scope 3',
  'Employee travel to work'
]

export default { prompt, schema, queryTexts }
