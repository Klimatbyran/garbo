import { z } from 'zod'

const schema = z.object({
  genderEquality: z.object({
    summary: z.string(),
    keyMetrics: z.array(
      z.object({
        metric: z.string(),
        value: z.number(),
      })
    ),
  }),
})

const prompt = `
Extract a summary of the company's gender equality efforts, along with any key metrics or goals related to gender equality.

Example:
\`\`\`json
{
  "genderEquality": {
    "summary": "ABB aims to increase female representation in leadership positions to 30% by 2025.",
    "keyMetrics": [
      { "metric": "Female leadership representation", "value": 25 },
      { "metric": "Equality training sessions", "value": 200 }
    ]
  }
}
\`\`\`
`

export default { schema, prompt }
