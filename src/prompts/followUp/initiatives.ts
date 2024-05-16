const initiatives = `
Extract the company sustainability initiatives. Add it as field initiatives:

Be as accurate as possible when extracting initiatives. These values will be plotted as dots on a graph later on.',

Example:
\`\`\`json
{ 
  "initiatives": [
    {
      "description": "We plan to switch to train for all business trips.",
      year: 2025,
      reductionPercent: 30,
      scope: "scope3.6_businessTravel",
    }
  ]
}
\`\`\`
`

export default initiatives
