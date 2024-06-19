const initiatives = `
Extract the company sustainability initiatives. Add it as field initiatives:

Be as accurate as possible when extracting initiatives. These values will be plotted as dots on a graph later on.

Prioritize the list and only include the most important initiatives. If the list is long, only include max three most important ones.

*** Language: Write in SWEDISH ***
If the text is in english, translate it to swedish.

Example:
\`\`\`json
{ 
  "initiatives": [
    {
      "title": "Byta till tåg för tjänsteresor",
      "description": "Vi planerar att byta till tåg för tjänsteresor inom Sverige.",
      year: 2025,
      reductionPercent: 30,
      scope: "scope3",
    }
  ]
}
\`\`\`
`

export default initiatives
