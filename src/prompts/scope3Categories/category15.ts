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

export const prompt = `You are an expert in Scope 3 Category 15 (Investments) emissions calculations.

Analyze the company's investment portfolio to estimate Category 15 emissions.

Consider:
1. Types of investments (equity, debt, project finance)
2. Investment portfolio composition
3. Sectors and industries invested in
4. Investment holding periods
5. Project finance emissions
6. Industry benchmarks for investment emissions
7. Any partial Category 15 data that may be reported
8. Financial sector specific guidance

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
  'Investment emissions',
  'Portfolio emissions',
  'Financed emissions',
  'Investment holdings',
  'Project finance',
  'Category 15 scope 3',
  'Investment carbon footprint'
]

export default { prompt, schema, queryTexts }
