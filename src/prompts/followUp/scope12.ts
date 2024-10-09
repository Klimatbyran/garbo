import { z } from 'zod'

// TODO: handle reporting period. Do we need it before we can extract emissions?
// Or should we extract reporting periods here too?
// we could turn the expected schema into an array of reporting periods, where each period includes the emissions for that period.
// Or maybe we should avoid that complexity and just use the endDate (or endYear) for each reporting period?
// This would force manual handling of reporting period dates, but it might be more reliable than garbo extraction.
// Alternatively, we might default to reporting periods of January 1st - December 31st to keep it simple and consistant.
// If the reporting period dates are extracted in a previous step, we could re-use them in here. However, that might make it harder to let garbo only suggest changes for the emissions for example.

const schema = z.object({
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

const prompt = `
Extract scope 1 and 2 emissions according to the GHG protocol (CO2e). Include all years you can find and never exclude the latest year.
Include market-based and location-based in scope 2. Always use tonnes CO2e as the unit, so if emissions are presented in other units (for example, in kilotonnes), convert this to tonnes.

NEVER CALCULATE ANY EMISSIONS. ONLY REPORT THE DATA AS IT IS IN THE PDF. If you can't find any data or if you are uncertain, report it as null. Do not use markdown in the output.

Example - feel free to add more fields and relevant data:
{
  "2021": {
    "scope1": {
      "total": 12.3
    },
    "scope2": {
      "mb": 23.4,
      "lb": 34.5,
      "unknown": null
    }
  },
  "2022": { ... },
  "2023": { ... }
}
`

export default { prompt, schema }
