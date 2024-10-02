import { z } from 'zod'

export const schema = z.object({
  companyName: z.string(),
  website: z.string().optional(),
  orgNr: z.string().optional(),
})

export const prompt = `
Extract the company name or organisation name. Also try to find other useful information about the organisation and include in the json. Just reply with the information you can find in json format:
{ 
   "companyName": "Company X",
   "website": "https://example.com",
   "orgNr": "1234567"
 }
`

export default { prompt, schema }
