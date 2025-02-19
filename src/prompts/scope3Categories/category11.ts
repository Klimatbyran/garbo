import { scope3CategoryAnalysisSchema } from '../../schemas/scope3CategoryAnalysis'

export const schema = scope3CategoryAnalysisSchema

export const prompt = `You are an expert in Scope 3 Category 11 (Use of Sold Products) emissions calculations.

Analyze the company's sold products and their use phase emissions to estimate Category 11 emissions.

Consider:
1. Types of products sold and their energy consumption patterns
2. Expected product lifetime and usage patterns
3. Energy sources used during product operation
4. Regional energy mix where products are used
5. Product efficiency improvements over time
6. Industry benchmarks for similar products
7. Any partial Category 11 data that may be reported
8. Total sales volumes and product mix

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
  'Use of sold products',
  'Product energy consumption',
  'Product lifecycle emissions',
  'Product use phase',
  'Energy efficiency',
  'Category 11 scope 3',
  'Product operation emissions',
]

export default { prompt, schema, queryTexts }
