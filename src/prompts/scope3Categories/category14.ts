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

export const prompt = `You are an expert in Scope 3 Category 14 (Franchises) emissions calculations.

Analyze the company's franchise operations to estimate Category 14 emissions.

Consider:
1. Number and types of franchised operations
2. Energy consumption patterns of typical franchises
3. Regional energy mix where franchises operate
4. Operational standards and requirements
5. Industry benchmarks for franchise emissions
6. Franchise growth and expansion plans
7. Any partial Category 14 data that may be reported
8. Typical franchise size and operations

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
  'Franchise operations',
  'Franchise emissions',
  'Franchise energy use',
  'Franchise locations',
  'Franchise standards',
  'Category 14 scope 3',
  'Franchise network'
]

export default { prompt, schema, queryTexts }
