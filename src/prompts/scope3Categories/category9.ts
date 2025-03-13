import { scope3CategoryAnalysisSchema } from '../../schemas/scope3CategoryAnalysis'

export const schema = scope3CategoryAnalysisSchema

export const prompt = `You are an expert in Scope 3 Category 9 (Downstream Transportation and Distribution) emissions calculations.

Analyze the company's downstream transportation and distribution activities to estimate Category 9 emissions.

Consider:
1. Types of products sold and their distribution patterns
2. Transportation modes used for product delivery
3. Average distribution distances
4. Third-party logistics providers
5. Storage and warehousing emissions
6. Industry benchmarks for distribution emissions
7. Any partial Category 9 data that may be reported
8. Regional distribution infrastructure

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
  'Downstream transportation',
  'Product distribution',
  'Logistics emissions',
  'Distribution network',
  'Product delivery',
  'Category 9 scope 3',
  'Transportation to customers',
]

export default { prompt, schema, queryTexts }
