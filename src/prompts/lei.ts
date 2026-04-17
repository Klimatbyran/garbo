import { z } from 'zod'

export const leiPrompt = `Please choose the appropriate lei number and return it as json.

Needs to be valid json. No comments etc here. Never guess any values. Only use the information from the context. Company Name should be filled from the wikidata node. Keep the syntax below:
\`\`\`json
{ 
  "lei": "12345678901234567890",
  "legalName": "Company Name",
}
\`\`\`


Please help me select the appropriate legal entity identifier (LEI) based on the gleif api search results below. Also prioritize swedish companies.`

export const leiSchema = z.object({
  lei: z.string(),
  legalName: z.string(),
})

export type LEI = z.infer<typeof leiSchema>['lei']
