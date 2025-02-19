import { scope3CategoryAnalysisSchema } from '../../schemas/scope3CategoryAnalysis'

export const schema = scope3CategoryAnalysisSchema
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
  'Lease agreements',
]

export default { prompt, schema, queryTexts }
