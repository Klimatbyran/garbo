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

export const prompt = `You are an expert in Scope 3 Category 4 (Upstream Transportation and Distribution) emissions calculations.

Analyze the company's upstream transportation and distribution activities to estimate Category 4 emissions.

Consider:
1. Company's supply chain logistics and transportation patterns
2. Types of transportation modes used (road, rail, sea, air)
3. Average distances for material/product transportation
4. Third-party warehousing and distribution centers
5. Industry benchmarks and emission factors for different transport modes
6. Company's geographical distribution of suppliers
7. Any partial Category 4 data that may be reported

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
  'Upstream transportation',
  'Distribution logistics',
  'Supply chain transport',
  'Logistics emissions',
  'Transportation providers',
  'Category 4 scope 3',
  'Freight transport'
]

export default { prompt, schema, queryTexts }
