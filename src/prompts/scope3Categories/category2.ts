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

export const prompt = `You are an expert in Scope 3 Category 2 (Capital Goods) emissions calculations.

Analyze the company's capital expenditure and asset acquisition data to estimate Category 2 emissions.

Consider:
1. Company's industry and typical capital asset requirements
2. Recent major investments or acquisitions
3. Reported capital expenditure and its relationship to emissions
4. Industry benchmarks for emissions from capital goods
5. Typical emission factors for different types of capital equipment
6. Asset replacement cycles
7. Any partial Category 2 data that may be reported

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
  'Capital goods',
  'Capital expenditure',
  'Fixed assets',
  'Equipment purchases',
  'Major investments',
  'Category 2 scope 3',
  'Asset acquisition'
]

export default { prompt, schema, queryTexts }
