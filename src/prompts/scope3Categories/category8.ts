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

export const prompt = `You are an expert in Scope 3 Category 8 (Upstream Leased Assets) emissions calculations.

Analyze the company's upstream leased assets to estimate Category 8 emissions.

Consider:
1. Types of assets leased by the company
2. Operating patterns of leased assets
3. Energy consumption of leased facilities
4. Vehicle fleet leasing arrangements
5. Equipment leasing agreements
6. Industry benchmarks for leased asset emissions
7. Any partial Category 8 data that may be reported
8. Regional energy mix where assets are operated

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
  'Upstream leased assets',
  'Leased equipment',
  'Leased facilities',
  'Leasing arrangements',
  'Equipment rental',
  'Category 8 scope 3',
  'Lease agreements'
]

export default { prompt, schema, queryTexts }
