const scope12 = `
Extract scope 1 and 2 emissions according to the GHG protocol (CO2e). Include all years you can find and never exclude latest year.
Include market based and location based in scope 2. Always use tonnes CO2e as unit, so if emissions are presented in other units (for example in kilotonnes), convert this to tonnes. Add it as field emissions:

NEVER CALCULATE ANY EMISSIONS. ONLY REPORT THE DATA AS IT IS IN THE PDF. If you can't find any data or if you are uncertain, report it as null.

Example - feel free to add more fields and relevant data:
\`\`\`json
{ 
  "emissions_scope12": {
    "2021": {
      "scope1": {
        emissions: 40.3,
        unit: "tCO2e"
      },
      "scope2": {
        mb: 10.4,
        lb: 14.5,
        unit: "tCO2e"
      }
    },
    "2022": { ...},
    "2023": { ...},
}
\`\`\`
`

export default { prompt: scope12 }
