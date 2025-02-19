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

export const prompt = `You are an expert in Scope 3 Category 10 (Processing of Sold Products) emissions calculations.

Analyze the company's sold products that require further processing to estimate Category 10 emissions.

Consider:
1. Types of intermediate products sold
2. Processing requirements for sold products
3. Energy intensity of processing steps
4. Industry-specific processing emissions
5. Downstream value chain structure
6. Regional energy mix in processing locations
7. Any partial Category 10 data that may be reported
8. Processing efficiency improvements

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
  'Processing of sold products',
  'Downstream processing',
  'Product processing emissions',
  'Manufacturing emissions',
  'Value chain processing',
  'Category 10 scope 3',
  'Product transformation'
]

export default { prompt, schema, queryTexts }
