const scope3 = `
Extract scope 3 emissions according to the GHG protocol. Add it as field emissions per year. Include all years you can find and never exclude latest year. Include as many categories as you can find and their scope 3 emissions.

Important! Always report according to the offical GHG categories. If you can't find the corresponding category, report it as "other".

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
