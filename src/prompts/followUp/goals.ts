import { z } from 'zod'

// TODO: In the future, import the schemas from a shared place
export const schema = z.object({
  goals: z.array(
    z.object({
      /** If the id is provided, the entity will be updated. Otherwise it will be created. */
      description: z.string(),
      year: z.string().optional(),
      target: z.number().optional(),
      baseYear: z.string().optional(),
    })
  ),
})

export const prompt = `
Extract the company goals for reducing their carbon emissions add it as field goals.
Be as accurate as possible when extracting goals. These values will be plotted in a graph later on.


Prioritize the list and only include the most important goals. If the list is long, only include max three most important ones (prioritize climate goals).

If no year is mentioned, set year to null.

** LANGUAGE: WRITE IN SWEDISH. If text is in english, translate to Swedish **

\`\`\`json
{ 
  "goals": [
    { description: 'Minska utsläppen med X%', 
      year: xxx, 
      target: xxx,
    }
  ]
}
\`\`\`
`
export default { prompt, schema }
