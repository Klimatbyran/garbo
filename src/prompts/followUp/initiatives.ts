import { z } from 'zod'

export const schema = z.object({
  initiatives: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      year: z.string(),
      scope: z.string(),
    })
  ),
})

export const prompt = `
Extract the company sustainability initiatives. Add it as field initiatives:

Be as accurate as possible when extracting initiatives. These values will be plotted as dots on a graph later on.

Prioritize the list and only include the most important initiatives. If the list is long, only include max three most important ones.

*** Language: Write in SWEDISH ***
If the text is in english, translate it to swedish.

Example: Do not use markdown in the output.
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

export default { prompt, schema }
