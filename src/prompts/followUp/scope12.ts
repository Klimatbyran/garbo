const scope12 = `
Extract scope 1 and 2 emissions according to the GHG protocol (CO2e). Include all years you can find and never exclude latest year.
Include market based and location based in scope 2. Add it as field emissions:

Example - feel free to add more fields and relevant data:
\`\`\`json
{ 
  "emissions": [
    {
      "year": 2021,
      "scope1": {
        emissions: 40,3,
        unit: "tCO2e"
      },
      "scope2": {
        mb: 10,4,
        lb: 14,5,
        unit: "tCO2e"
      }
    },
    { "year": 2022, ...}, 
    { "year": 2023, ...}] 
}
\`\`\`
`

export default scope12
