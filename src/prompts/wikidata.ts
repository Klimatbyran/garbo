import { z } from 'zod'

const prompt = `Please choose the appropriate wikidata node and return it as json. Prioritize the node with information about GHG carbon footprint if there are any.

Needs to be valid json. No comments etc here. Never guess any values. Only use the information from the context. Company Name should be filled from the wikidata node. Keep the syntax below:
\`\`\`json
{ "wikidata":
   {
    "node": "Q123456",
    "url": "https://www.wikidata.org/wiki/Q123456",
    "logo": "https://commons.wikimedia.org/wiki/File:Example.jpg",
    "label": "Company Name",
    "description": "Company Description",
  }
}
\`\`\`


Please help me select the appropriate node id based on the wikidata search results below.
Prioritize the company with carbon footprint reporting (claim: P5991). Also prioritize swedish companies.
`

const schema = z.object({
  wikidata: z.object({
    node: z.string(),
    url: z.string(),
    logo: z.string().optional(),
    label: z.string(),
    description: z.string().optional(),
  }),
})

export type Wikidata = z.infer<typeof schema>['wikidata']

export default { prompt, schema }
