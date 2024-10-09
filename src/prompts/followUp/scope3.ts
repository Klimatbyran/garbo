import { z } from 'zod'

export const schema = z.object({
  emissions: z.object({
    scope3: z
      .object({
        scope3Categories: z
          .array(
            z.object({
              category: z.number().int().min(1).max(16),
              total: z.number(),
            })
          )
          .optional(),
        statedTotalEmissions: z.object({ total: z.number() }).optional(),
      })
      .optional(),
    biogenic: z.object({ total: z.number() }).optional(),
    statedTotalEmissions: z.object({ total: z.number() }).optional(),
  }),
})

export const prompt = `
Extract scope 3 emissions according to the GHG protocol. Add it as field emissions per year. Include all years you can find and never exclude the latest year. Include as many categories as you can find and their scope 3 emissions.

Important! Always report according to the official GHG categories. If you can't find the corresponding category, report it as "other".

NEVER CALCULATE ANY EMISSIONS. ONLY REPORT THE DATA AS IT IS IN THE PDF. If you can't find any data or if you are uncertain, report it as null. If the company has reported individual categories but no totals, never try to calculate totals, just report it as is.

Regarding transport: If you can't find the exact category, report it as "4_upstreamTransportationAndDistribution" or "9_downstreamTransportationAndDistribution" depending on the context.

If the company is identified as a financial institution or investment company, look for emissions data from investments, the portfolio, or financed emissions. They are often found elsewhere in the report. Do not use markdown in the output.

1: purchasedGoods
2: capitalGoods
3: fuelAndEnergyRelatedActivities
4: upstreamTransportationAndDistribution
5: wasteGeneratedInOperations
6: businessTravel
7: employeeCommuting
8: upstreamLeasedAssets
9: downstreamTransportationAndDistribution
10: processingOfSoldProducts
11: useOfSoldProducts
12: endOfLifeTreatmentOfSoldProducts
13: downstreamLeasedAssets
14: franchises
15: investments

Example: Keep this format and add as many years as you can find. Keep the categories you find and if the company has invented new categories, please add them to the 16_other category.
{
  "emissions": [
    {
      "year": 2021,
      "scope3": {
        "scope3Categories": [
          { "category": 1, "total": 10},
          { "category": 2, "total": 20},
          { "category": 3, "total": 40},
          { "category": 14, "total": 40}
        ],
        "statedTotalEmissions": { "total": 110 }
      }
    },
    { "year": 2022, ... },
    { "year": 2023, ... }
  ]
}
`

export default { prompt, schema }
