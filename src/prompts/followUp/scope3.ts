const scope3 = `
Extract scope 3 emissions according to the GHG protocol. Add it as field emissions per year. Include all years you can find and never exclude latest year. Include as many categories as you can find and their scope 3 emissions.

Example - feel free to add more fields and relevant data:

\`\`\`json
{ 
  "emissions": [
    {
      "year": 2021,
      "scope3": {
        "categories": {
          "1_purchasedGoods": 10,
          "2_capitalGoods": 20,
          "3_fuelAndEnergyRelatedActivities": 40
        }
        "totalEmissions": 100,
        "unit": "tCO2e"
      },
    },
    { "year": 2022, ...}, 
    { "year": 2023, ...}] 
}
\`\`\`
`

export default scope3
