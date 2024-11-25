import { z } from 'zod'

export const schema = z.object({
  economy: z.array(
    z.object({
      year: z.number(),
      economy: z
        .object({
          turnover: z
            .object({
              value: z.number().optional(),
              currency: z.string().optional(),
            })
            .optional(),
          employees: z
            .object({
              value: z.number().optional(),
              unit: z.string().optional(),
            })
            .optional(),
        })
        .optional(),
    })
  ),
})

// NOTE: Maybe split this into two parts, one for turnover and another for employees, to allow re-running them separately

export const prompt = `
*** Turnover ***
- Use the turnover field to specify the turnover (intäkter, omsättning) of the company. If the currency is not specified, assume SEK. Be as accurate as possible. These values will be used to calculate the emissions intensity of the company so be sure to specify the value in SEK or EUR - not "mSEK" or "mEUR". Extract this data for all available years.
*** Currencies: ***
- turnover: SEK or EUR
- if it makes sense, use MSEK or MEUR
- if the currency is not specified, assume SEK
*** Employees: ***
- Extract the number of employees for all available years. The unit can be for example "FTE" (full-time equivalent) or average number of employees during the year.
*** Dates: ***
- if no year is specified, assume the current year ${new Date().getFullYear()}
Example, follow the format below. Do not use markdown in the output:
{
  "economy": [
    {
      "year": 2021,
      "employees": {
        "value": 10000,
        "unit": "FTE"
      },
      "turnover": {
        "value": 12345,
        "currency: "MSEK"
      },
    },
    {
      "year": 2022,
      "employees": {
        "value": 11000,
        "unit": "FTE"
      },
      "turnover": {
        "value": 14345,
        "currency: "MSEK"
      },
    },
  ]
}
`

const queryTexts = [
  'Extract turnover (intäkter, omsättning) values in SEK or EUR for all available years.',
  'Extract the number of employees with their units (e.g., FTE) for all available years.',
  'Retrieve company economy data including turnover in SEK or EUR and number of employees with units for each year.',
]

export default { prompt, schema, queryTexts }
