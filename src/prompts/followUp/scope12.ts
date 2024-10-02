import { z } from 'zod'

export const schema = z.object({
  emissions: z.record(
    z.object({
      scope1: z.object({
        emissions: z.number(),
        unit: z.string(),
      }),
      scope2: z.object({
        mb: z.number(),
        lb: z.number(),
        unit: z.string(),
      }),
    })
  ),
})

export const prompt = `
Extract scope 1 and 2 emissions according to the GHG protocol (CO2e). Include all years you can find and never exclude latest year.
Include market based and location based in scope 2. Always use tonnes CO2e as unit, so if emissions are presented in other units (for example in kilotonnes), convert this to tonnes. Add it as field emissions:

NEVER CALCULATE ANY EMISSIONS. ONLY REPORT THE DATA AS IT IS IN THE PDF. If you can't find any data or if you are uncertain, report it as null. Do not use markdown in the output.

Example - feel free to add more fields and relevant data:
{
  "emissions": {
    "2021": {
      "scope1": {
        "emissions": 12.3,
        "unit": "tCO2e"
      },
      "scope2": {
        "mb": 23.4,
        "lb": 34.5,
        "unit": "tCO2e"
      }
    },
    "2022": { ... },
    "2023": { ... }
  }
}
`

export default { prompt, schema }
