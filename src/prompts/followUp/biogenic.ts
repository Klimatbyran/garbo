import { z } from 'zod'

const schema = z.object({
  biogenic: z.array(
    z.object({
      year: z.number(),
      biogenic: z.object({ total: z.number() }).optional(),
    })
  ),
})

const prompt = `
Extract biogenic emissions according to the GHG protocol (CO2e). Include all years you can find and never exclude the latest year.
Always use tonnes CO2e as the unit, so if emissions are presented in other units (for example, in kilotonnes), convert this to tonnes.

NEVER CALCULATE ANY EMISSIONS. ONLY REPORT THE DATA AS IT IS IN THE PDF. If you can't find any data or if you are uncertain, report it as null. Do not use markdown in the output.

Example - feel free to add more fields and relevant data:
{
  "biogenic": [{
    "year": 2021,
    "total": 12.3
  }]
`

export default { prompt, schema }
