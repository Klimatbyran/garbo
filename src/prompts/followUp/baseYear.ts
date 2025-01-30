import { z } from 'zod'

const schema = z.object({
  baseYear: z.number().nullable(),
})

const prompt = `
### Base Year

Extract the **base year** explicitly stated in the context of the report. The base year refers to the first year of fully reliable and comparable emissions data as defined by the reporting entity. 

**Rules**:
1. Only include a base year if it is **explicitly stated** in the report.
2. If no base year is explicitly mentioned, set the base year to \`null\`.
3. Do not infer or estimate the base year from the data or context.

**Output Format**:
The base year should be extracted as a single numeric value or explicitly set to \`null\`.

### Example Output:
This is only an example format; do not include this specific data in the output:
\`\`\`json
{
  "baseYear": 2018
}
\`\`\`

If no base year is explicitly stated:
\`\`\`json
{
  "baseYear": null
}
\`\`\`
`

const queryTexts = [
  'Base year for emissions reporting',
  'GHG protocol base year data',
]

export default { prompt, schema, queryTexts }
