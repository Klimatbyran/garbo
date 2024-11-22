import { z } from 'zod'

export const schema = z.object({
  initiatives: z.array(
    z.object({
      title: z.string(),
      description: z.string().optional(),
      year: z.string().optional(),
      scope: z.string().optional(),
    })
  ),
})

export const prompt = `
Extract the company sustainability initiatives. Add it as field initiatives:

Be as accurate as possible when extracting initiatives. These values will be plotted as dots on a graph later on.

Prioritize the list and only include the most important initiatives. If the list is long, only include max three most important ones.

*** Language: Write in SWEDISH ***
If the text is in english, translate it to swedish.

Example: Ensure the output is in JSON format and do not use markdown.
\`\`\`json
{
  "initiatives": [
    {
      "title": "Byta till tåg för tjänsteresor",
      "description": "Vi planerar att byta till tåg för tjänsteresor inom Sverige.",
      "year": "2025",
      "scope": "scope3"
    }
  ]
}
\`\`\`
`

const queryTexts = [
  'Sustainability initiatives',
  'Key climate actions',
  'Environmental goals and plans',
]

export default { prompt, schema, queryTexts }
