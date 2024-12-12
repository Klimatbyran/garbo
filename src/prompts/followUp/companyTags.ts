import { z } from 'zod'

export const schema = z.object({
  tags: z.array(
    z.enum([
      'public',
      'large-cap',
      'mid-cap',
      'state-owned',
      'municipality-owned',
      'private',
    ])
  ),
})

export const prompt = `
Analyze the company information and determine which tags apply. Only use these specific tags:

- public: For publicly traded companies listed on any stock exchange
- large_cap: For companies listed on large cap stock indices
- mid_cap: For companies listed on mid cap stock indices  
- state_owned: For companies owned by the national government
- municipality_owned: For companies owned by municipalities/local governments
- private: For all other private companies not covered by the above tags

A company can have multiple tags if applicable (e.g. both 'public' and 'large_cap').

Return the tags in JSON format like this:
{
  "tags": ["tag1", "tag2"]
}

Only use the exact tags listed above. Do not add any other tags.
Do not include explanatory text, only return the JSON.
If you cannot determine any tags with certainty, return an empty array.
`

const queryTexts = [
  'Company ownership structure',
  'Stock exchange listing',
  'Market cap',
  'Government ownership',
  'Municipal ownership',
  'Company type',
  'Corporate structure',
]

export default { prompt, schema, queryTexts }
