import { z } from 'zod'

export const schema = z.object({
  showNotes: z.object({
    title: z.string(),
    script: z.string(),
  }),
})

export const prompt = `
## Climate Report Show Notes Generator

Create a concise, engaging script for a climate news report about this company's emissions data. The script should:

1. Have a catchy title that captures the essence of the company's climate performance
2. Be less than one minute when read aloud (approximately 150-200 words)
3. Focus on the most significant findings from the emissions report
4. Include both positive developments and areas of concern
5. Use a conversational, slightly critical tone
6. Include natural pauses indicated by [[pause 0.5s]] notation (vary pause lengths between 0.5-1.2s)
7. End with a thought-provoking question or statement
8. Close with "This was Garbo—back soon with more climate truth."

### Format Guidelines:
- Highlight year-over-year changes in emissions
- Compare current progress against stated goals
- Mention specific initiatives or technologies when relevant
- Use simple, direct language with short sentences
- Include specific numbers to add credibility

Return the script in this JSON format:
\`\`\`json
{
  "showNotes": {
    "title": "Catchy Title About Company's Climate Performance",
    "script": "Opening statement about the company's climate goals or performance.\\n[[pause 0.8s]]\\n\\nSpecific point about emissions data.\\n[[pause 0.5s]]\\n\\nComparison to previous year or stated goals.\\n[[pause 0.6s]]\\n\\nCritical observation.\\n[[pause 1.2s]]\\n\\nAnother key point about different emissions scope.\\n\\n[...additional content...]\\n\\nThought-provoking closing question.\\n[[pause 1s]]\\n\\nThis was Garbo—back soon with more climate truth."
  }
}
\`\`\`

Remember to base your script ONLY on factual information present in the report. Do not invent or assume data that isn't explicitly mentioned.
`

const queryTexts = [
  'Company emissions data',
  'Climate goals and targets',
  'Year-over-year emissions changes',
  'Scope 1 2 3 emissions',
  'Carbon reduction initiatives',
  'Climate strategy',
  'Sustainability performance',
  'Emissions reduction progress',
  'Climate commitments',
  'Environmental impact'
]

export default { prompt, schema, queryTexts }
