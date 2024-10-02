import { z } from 'zod'

export const schema = z.object({
  emissions_scope3: z.array(
    z.object({
      year: z.number(),
      scope3: z.object({
        categories: z.record(z.number()),
        totalEmissions: z.number(),
        unit: z.string(),
      }),
    })
  ),
})

export const prompt = `
Extract scope 3 emissions according to the GHG protocol. Add it as field emissions per year. Include all years you can find and never exclude latest year. Include as many categories as you can find and their scope 3 emissions.

Important! Always report according to the offical GHG categories. If you can't find the corresponding category, report it as "other".

NEVER CALCULATE ANY EMISSIONS. ONLY REPORT THE DATA AS IT IS IN THE PDF. If you can't find any data or if you are uncertain, report it as null. If the company has reported individual categories but no totals- never try to calculate totals, just report it as is.

Regarding transport: If you can't find the exact category, report it as "4_upstreamTransportationAndDistribution" or "9_downstreamTransportationAndDistribution" depending on the context.

If the company is idientified as a financial institution or investment company, look for emissions data from investements, the portfolio, or financed emissions. They are often found elsewhere in the report. 

1_purchasedGoods
2_capitalGoods
3_fuelAndEnergyRelatedActivities
4_upstreamTransportationAndDistribution
5_wasteGeneratedInOperations
6_businessTravel
7_employeeCommuting
8_upstreamLeasedAssets
9_downstreamTransportationAndDistribution
10_processingOfSoldProducts
11_useOfSoldProducts
12_endOfLifeTreatmentOfSoldProducts
13_downstreamLeasedAssets
14_franchises
15_investments
16_other



Example: Keep this format and add as many years as you can find. Keep the categories you find and if the company has invented new categories, please add them to the 16_other category.
{
  "emissions_scope3": [
    {
      "year": 2021,
      "scope3": {
        "categories": {
          "1_purchasedGoods": 10,
          "2_capitalGoods": 20,
          "3_fuelAndEnergyRelatedActivities": 40,
          "14_franchises": 40
        },
        "totalEmissions": 100,
        "unit": "tCO2e"
      }
    },
    { "year": 2022, ... },
    { "year": 2023, ... }
  ]
}
`

export default { prompt, schema }
