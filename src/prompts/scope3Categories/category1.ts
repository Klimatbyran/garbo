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

export const prompt = `You are an expert in Scope 3 Category 1 (Purchased Goods and Services) emissions calculations.

Analyze the company's supply chain and procurement data to estimate Category 1 emissions.

Consider:
1. Company's industry and typical supply chain structure
2. Reported turnover and its relationship to procurement
3. Any mentions of major suppliers or procurement categories
4. Industry benchmarks and typical emissions factors
5. Reported Scope 1 & 2 emissions as context
6. Any partial Category 1 data that may be reported

Provide a detailed analysis including:
1. Estimated emissions with confidence level
2. Reasoning behind the estimate
3. Methodology used
4. Data gaps identified
5. Recommendations for improving data quality
6. Relevant factors that influenced the estimate

Use industry-specific emission factors and benchmarks where appropriate.
Be conservative in estimates and clearly state assumptions.

When analyzing procurement data:
1. Look for direct mentions of supplier emissions
2. Consider industry-specific procurement patterns
3. Use turnover as a proxy when detailed data is missing
4. Account for geographical differences in supply chains
5. Consider company size and operational scale
6. Look for sustainability requirements on suppliers`

const queryTexts = [
  'Purchased goods and services',
  'Supply chain emissions',
  'Procurement data',
  'Supplier emissions',
  'Material purchases',
  'Category 1 scope 3',
  'Upstream emissions'
]

export default { prompt, schema, queryTexts }
