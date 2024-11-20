import { z } from 'zod'

const schema = z.object({
  biogenic: z.array(
    z.object({
      year: z.number(),
      biogenic: z.object({ total: z.number() }).optional(),
    })
  ),
})

const prompt = `BIOGENIC EMISSIONS
Biogenic emissions are emissions from the combustion of biomass, not to be confused with fossil fuel emissions.

Extract biogenic emissions according to the GHG protocol (CO2e). Include all years you can find and never exclude the latest year.
Always use tonnes CO2e as the unit, so if emissions are presented in other units (for example, in kilotonnes), convert this to tonnes.
NEVER CALCULATE ANY EMISSIONS. ONLY REPORT THE DATA AS IT IS IN THE PDF.

If you can't find any information about biogenic emissions, report it as an empty array.
If you find biogenic emissions for some years but not for others, report the years you find and leave the others out.

Json example:
{
  "biogenic": [{
    "year": 2021,
    "biogenic": {
      "total: 12.3
    }
  }]
}
`

export default { prompt, schema }
