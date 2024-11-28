import { z } from 'zod'

export const schema = z.object({
  scope3: z.array(
    z.object({
      year: z.number(),
      scope3: z
        .object({
          categories: z
            .array(
              z.object({
                category: z.number().int(),
                total: z.number(),
              })
            )
            .optional(),
          statedTotalEmissions: z.object({ total: z.number() }).optional(),
        })
        .optional(),
    })
  ),
})

export const prompt = `## Scope 3:
Extract scope 3 emissions according to the GHG Protocol and organize them by year. Add a field \`scope3\` and include as many categories as explicitly reported. Always include the latest year if available. Do not infer or estimate data.

### Instructions:

1. **Reporting Categories**:
  Always report data according to the official GHG Protocol categories. If a reported category does not match the official list, include it under "16: Other."

  GHG Categories:
   1: Purchased Goods
   2: Capital Goods
   3: Fuel And Energy Related Activities
   4: Upstream Transportation And Distribution
   5: Waste Generated In Operations
   6: Business Travel
   7: Employee Commuting
   8: Upstream Leased Assets
   9: Downstream Transportation And Distribution
   10: Processing Of Sold Products
   11: Use Of Sold Products
   12: End Of Life Treatment Of Sold Products
   13: Downstream Leased Assets
   14: Franchises
   15: Investments
   16: Other

2. **Missing Or Incomplete Data**:
  If data is missing or unclear, explicitly report it as \`null\`. Do not make assumptions or attempt to infer missing values.

3. **Units**:
  Report all emissions in metric tons of CO2 equivalent. If the data is provided in a different unit (kton = 1000 tCO2, Mton = 1000000 tCO2), convert it. This is the only permitted calculation.

4. **Financial Institutions**:
  If the company is a financial institution, look specifically for emissions data related to investments, portfolio, or financed emissions. These may be located in separate sections of the report.

5. **Totals**:
  Only report total emissions if explicitly stated. Do not calculate totals, even if all categories are individually reported.

6. **Transportation Categories**:
  If a transportation-related category is unclear, classify it as either \`4: Upstream Transportation And Distribution\` or \`9: Downstream Transportation And Distribution\` based on how it is described.

7. **Output Format**:
  Keep the output strictly in JSON format, following this structure:

\`\`\`json
{
  "scope3": [
  {
    "year": 2021,
    "scope3": {
      "categories": [
        { "category": 1, "total": 10 },
        { "category": 2, "total": 20 },
        { "category": 3, "total": 40 },
        { "category": 14, "total": 40 }
      ],
      "statedTotalEmissions": { "total": 110 }
    }
  },
  {
    "year": 2022,
    "scope3": null
  },
  {
    "year": 2023,
    "scope3": null
  }
  ]
}
\`\`\`
`

const queryTexts = [
  'Scope 3 emissions by category',
  'GHG protocol Scope 3 data',
  'Emissions per year and category',
  `purchasedGoods capitalGoods fuelAndEnergyRelatedActivities 
  upstreamTransportationAndDistribution wasteGeneratedInOperations 
  businessTravel employeeCommuting upstreamLeasedAssets 
  downstreamTransportationAndDistribution processingOfSoldProducts 
  useOfSoldProducts endOfLifeTreatmentOfSoldProducts downstreamLeasedAssets 
  franchises investments other`,
]

export default { prompt, schema, queryTexts }
