import { scope3CategoryAnalysisSchema } from '../../schemas/scope3CategoryAnalysis'

export const schema = scope3CategoryAnalysisSchema
export const prompt = `You are an expert in Scope 3 Category 12 (End-of-Life Treatment of Sold Products) emissions calculations.

Analyze the company's products' end-of-life treatment to estimate Category 12 emissions.

Consider:
1. Types of products sold and their disposal methods
2. Product lifespans and disposal patterns
3. Waste treatment methods for different materials
4. Regional waste management infrastructure
5. Recycling rates and practices
6. Industry benchmarks for product disposal emissions
7. Any partial Category 12 data that may be reported
8. Material composition of products

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
  'End-of-life treatment',
  'Product disposal',
  'Waste treatment',
  'Product recycling',
  'Disposal emissions',
  'Category 12 scope 3',
  'Product end of life',
]

export default { prompt, schema, queryTexts }
