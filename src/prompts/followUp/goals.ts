const goals = `
Extract the company goals for reducing their carbon emissions add it as field goals.
Be as accurate as possible when extracting goals. These values will be plotted in a graph later on. Only keep max 3-5 most relevant goals, if there are too many to fit in the field, only keep the most important ones.

** WRITE IN SWEDISH **

\`\`\`json
{ 
  "goals": [
    { description: 'Net zero innan xxx.', 
      year: xxx, 
      reductionPercent: 100
    }
  ]
}
\`\`\`
`

export default goals
