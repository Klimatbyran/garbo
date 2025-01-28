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
                unit: z.enum(['tCO2e', 'tCO2']),
              })
            )
            .nullable()
            .optional(),
          statedTotalEmissions: z
            .object({ total: z.number(), unit: z.enum(['tCO2e', 'tCO2']) })
            .nullable()
            .optional(),
        })
        .nullable()
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
  
  Upstream: 
  1. Purchased Goods and Services: Emissions from the production of goods and services purchased by the company, such as raw materials and office supplies.
  2. Capital Goods: Emissions from the production and transportation of long-term assets purchased by the company, such as machinery, vehicles, or buildings.
  3.Fuel- and Energy-Related Activities (not included in Scope 1 or 2): Emissions from the extraction, production, and transportation of fuels and electricity purchased by the company, not directly consumed.
  4.Upstream Transportation and Distribution: Emissions from transport and distribution services purchased by the company, either for transport of goods purchased by the company, or supplier deliveries that the company has operational control over.
  5.Waste Generated in Operations: Emissions from the treatment and disposal of waste generated during business operations, such as landfilling, recycling, or incineration.
  6.Business Travel: Emissions from employee travel in vehicles not owned by the company, such as flights or rental cars.
  7.Employee Commuting: Emissions from employees traveling between home and work, regardless of transport mode. This also includes emissions from working from home.
  8.Upstream Leased Assets: Emissions from the operation of leased assets used by the company but owned by another entity, such as leased vehicles.
  
  Downstream:
  9. Downstream Transportation and Distribution: Emissions from the transport and distribution of sold goods after they leave the company, including delivery to end-users. Note that if the company pays for the service, it falls under category 4 (upstream).
  10. Processing of Sold Products: Emissions that occur when customers further process the sold products, such as refining crude oil sold by the company or turning raw paper into newspaper.
  11. Use of Sold Products: Emissions from the use of the company’s sold products, especially those that emit greenhouse gases during use, like fuels or vehicles that use fuels. Another example is energy-consuming products such as machinery.
  12. End-of-Life Treatment of Sold Products: Emissions from the disposal or recycling of the company’s sold products after they’ve been used.
  13. Downstream Leased Assets: Emissions from the operation of assets leased to others, such as buildings or equipment owned by the company but operated by tenants.
  14. Franchises: Emissions from franchise operations operating under the company’s brand, such as emissions from franchised restaurants or retail stores.
  15. Investments: Emissions related to the company’s investments, such as those from financed projects or portfolio companies.
  16. Other: Any other relevant emissions sources not covered by the categories above, such as outsourced activities or unique business processes. Note that this is not in line with the GHG protocol, but used in this process to include emissions not accurately categorised by the company.

2. **Missing Or Incomplete Data**:
- Extract values only if explicitly available in the context. Do not infer or create data. Leave optional fields absent or explicitly set to null if no data is provided.

3. **Units**:
- Always report emissions in metric tons (**tCO2e** or **tCO2**). The unit **tCO2e** (tons of CO2 equivalent) is preferred.
- If a company explicitly reports emissions without the "e" suffix (e.g., **tCO2**), use **tCO2** as the unit. However, if no unit is specified or it is unclear, assume the unit is **tCO2e**.
- All values must be converted to metric tons if they are provided in other units:
  - Example: 
    - 1000 CO2e → 1 tCO2e
    - 1000 CO2 → 1 tCO2
    - 1 kton CO2e → 1000 tCO2e
    - 1 Mton CO2 → 1,000,000 tCO2
- Use **tCO2** only if it is explicitly reported without the "e" suffix, otherwise default to **tCO2e**.

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
        { "category": 1, "total": 10, "unit": "tCO2e" },
        { "category": 2, "total": 20, "unit": "tCO2e" },
        { "category": 3, "total": 40, "unit": "tCO2e" },
        { "category": 14, "total": 40, "unit": "tCO2e" }
      ],
      "statedTotalEmissions": { "total": 110, "unit": "tCO2e" }
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
  'carbon emissions CO2',
]

export default { prompt, schema, queryTexts }
