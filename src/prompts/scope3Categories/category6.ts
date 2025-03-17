import { scope3CategoryAnalysisSchema } from '../../schemas/scope3CategoryAnalysis'

export const schema = scope3CategoryAnalysisSchema

export const prompt = `You are an expert in Scope 3 Category 6 (Business Travel) emissions calculations.

Analyze the company's business travel activities to estimate Category 6 emissions.

Consider:
1. Types of business travel (air, rail, car, etc.)
2. Number of employees and travel patterns
3. Company's geographical spread and office locations
4. Travel policies and restrictions
5. Remote work policies impact on travel
6. Industry benchmarks for business travel emissions
7. Any partial Category 6 data that may be reported

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
  'Business travel',
  'Employee travel',
  'Air travel emissions',
  'Travel policy',
  'Corporate travel',
  'Category 6 scope 3',
  'Travel carbon footprint',
]

export default { prompt, schema, queryTexts }
