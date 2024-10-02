import { z } from 'zod'

export const schema = z.object({
  contacts: z.array(
    z.object({
      name: z.string().optional(),
      role: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
    })
  ),
})

export const prompt = `
Extract the company sustainability contacts. Add it as field contacts:
Be as accurate as possible when extracting contacts. These values will be
used to contact the company with the extract later on for manual approval.

If no contacts are found, leave the field empty ("contacts": []).

NEVER GUESS VALUES OR KEEP EXAMPLE DATA

IMPORTANT: If a field does not exist or is not found, it should be omitted from the output. Do not use placeholder values like "N/A" or empty strings.

Example (never keep any example data in your final response):
\`\`\`json
{
  "contacts": [
    {
      "name": "John Doe",
      "role": "Sustainability Manager",
      "email": "john@doe.se",
      "phone": "123456789"
    }
  ]
}
\`\`\`

Your task:
1. Extract only the real data available. If a piece of information (like name, role, email, or phone) is missing, omit that field entirely.
2. If no contacts are found, return an empty array as follows: "contacts": [].
3. Ensure no example data is included in the final output.
`

export default { prompt, schema }
