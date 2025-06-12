import { z } from 'zod'

export const schema = z.object({
  diversityInclusion: z.array(
    z.object({
      title: z.string(),
      description: z.string().optional(),
      year: z.string().optional(),
    })
  ),
})

export const prompt = `
Extract the company's diversity and inclusion initiatives. Add it as field diversityInclusion:

Be as accurate as possible when extracting these initiatives. The values will be plotted as dots on a graph later on.

Prioritize the list and only include the most important initiatives. If the list is long, only include max three most important ones.

*** Language: Write in SWEDISH ***
If the text is in english, translate it to swedish.

Example: Ensure the output is in JSON format and do not use markdown.
\`\`\`json
{
  "diversityInclusion": [
    {
      "title": "En inkluderande arbetsplats",
      "description": "Vi strävar efter att skapa en arbetsplats helt fri från trakasserier och diskriminering.",
      "year": "2025"
    }
  ]
}
\`\`\`
`

const queryTexts = [
  'Diversity and inclusion initiatives',
  'Harassment and discrimination',
  'Gender equality',
]

export default { prompt, schema, queryTexts }
