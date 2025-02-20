import { scope3CategoryAnalysisSchema } from '../../schemas/scope3CategoryAnalysis'

export const schema = scope3CategoryAnalysisSchema

export const prompt = `You are an expert in Scope 3 Category 5 (Waste Generated in Operations) emissions calculations.

Analyze the company's waste management and disposal activities to estimate Category 5 emissions.

Consider:
1. Types and volumes of waste generated
2. Waste treatment methods (landfill, recycling, incineration)
3. Emission factors for different waste treatment methods
4. Industry benchmarks for waste generation
5. Company's waste reduction initiatives
6. Regional waste management practices
7. Any partial Category 5 data that may be reported

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
  'Waste generated in operations',
  'Waste management',
  'Waste disposal',
  'Recycling data',
  'Landfill waste',
  'Category 5 scope 3',
  'Operational waste',
]

export default { prompt, schema, queryTexts }
