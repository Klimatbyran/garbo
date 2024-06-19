const goals = `
Extract the company goals for reducing their carbon emissions add it as field goals.
Be as accurate as possible when extracting goals. These values will be plotted in a graph later on.


Prioritize the list and only include the most important goals. If the list is long, only include max three most important ones.

** LANGUAGE: WRITE IN SWEDISH. If text is in english, translate to Swedish **

\`\`\`json
{ 
  "goals": [
    { description: 'Minska utsläppen med 50%', 
      year: xxx, 
      reductionPercent: 100
    }
  ]
}
\`\`\`
`

export default goals
