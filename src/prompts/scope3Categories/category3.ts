import { z } from 'zod'
import { emissionUnitSchemaGarbo } from '../../api/schemas'
import { scope3CategoryAnalysisSchema } from '../../schemas/scope3CategoryAnalysis'

export const schema = scope3CategoryAnalysisSchema

export const prompt = `You are an expert in Scope 3 Category 3 (Fuel and Energy-Related Activities) emissions calculations.

Analyze the company's fuel and energy-related activities not included in Scope 1 or 2 to estimate Category 3 emissions.

Consider:
1. Company's total energy consumption patterns
2. Types of fuels and energy sources used
3. Upstream emissions from fuel extraction and processing
4. Transmission and distribution losses
5. Generation of purchased electricity not covered in Scope 2
6. Industry benchmarks and emission factors
7. Any partial Category 3 data that may be reported

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
  'Fuel and energy-related activities',
  'Energy consumption',
  'Transmission and distribution losses',
  'Upstream fuel emissions',
  'Energy generation emissions',
  'Category 3 scope 3',
  'Energy-related scope 3',
]

export default { prompt, schema, queryTexts }
