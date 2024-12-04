import { z } from 'zod'

const schema = z.object({
  scope12: z.array(
    z.object({
      year: z.number(),
      scope1: z
        .object({
          total: z.number(),
        })
        .optional(),
      scope2: z
        .object({
          mb: z
            .number({ description: 'Market-based scope 2 emissions' })
            .optional(),
          lb: z
            .number({ description: 'Location-based scope 2 emissions' })
            .optional(),
          unknown: z
            .number({ description: 'Unspecified Scope 2 emissions' })
            .optional(),
        })
        .refine(
          ({ mb, lb, unknown }) =>
            mb !== undefined || lb !== undefined || unknown !== undefined,
          {
            message:
              'At least one property of `mb`, `lb` and `unknown` must be defined if scope2 is provided',
          }
        )
        .optional(),
    })
  ),
})

const prompt = `
Extract scope 1 and 2 emissions according to the GHG protocol (CO2e). Include all years you can find and never exclude the latest year.
Include market-based and location-based in scope 2. Always use tonnes CO2e as the unit, so if emissions are presented in other units (for example, in kilotonnes), convert this to tonnes.

NEVER CALCULATE ANY EMISSIONS. ONLY REPORT THE DATA AS IT IS IN THE PDF. If you can't find any data or if you are uncertain, report it as null. Do not use markdown in the output.

Example - feel free to add more fields and relevant data:
{
  "scope12": [{
    "year": 2023,
    "scope1": {
      "total": 12.3
    },
    "scope2": {
      "mb": 23.4,
      "lb": 34.5,
      "unknown": null
    }
  }]
`

const queryTexts = [
  'Scope 1 and 2 emissions',
  'Market-based and location-based emissions',
  'GHG protocol Scope 1 and 2 data',
]

export default { prompt, schema, queryTexts }
