import { z } from 'zod'

export const schema = z.object({
  analysis: z.object({
    materialCategories: z.array(z.object({
      category: z.number(),
      reason: z.string(),
      priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
      estimatedImpact: z.string()
    })),
    reasoning: z.string(),
    recommendations: z.array(z.string())
  })
})

export const prompt = `You are an expert in GHG Protocol Scope 3 reporting requirements.

Analyze the company's scope 3 reporting and identify which missing categories should be material for this type of company.

Consider:
1. Company's industry and typical value chain
2. Size and operational scope
3. Reported scope 1 & 2 emissions as context
4. Any partial scope 3 data already reported
5. Industry benchmarks and best practices

Provide your analysis in this format:
{
  "analysis": {
    "materialCategories": [
      {
        "category": 1,
        "reason": "As a manufacturing company, purchased goods and services typically represent significant emissions",
        "priority": "HIGH",
        "estimatedImpact": "Likely 40-60% of total scope 3 emissions"
      }
    ],
    "reasoning": "Detailed explanation of why these categories are material",
    "recommendations": [
      "Specific recommendations for improving scope 3 coverage"
    ]
  }
}`

const queryTexts = [
  'Scope 3 emissions',
  'Value chain emissions',
  'Indirect emissions',
  'Supply chain carbon',
  'Scope 3 categories',
  'Material categories'
]

export default { prompt, schema, queryTexts }
