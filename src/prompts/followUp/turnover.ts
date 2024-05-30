const turnover = `
Extract the company turnover. Add it as field turnover. Be as accurate as possible when extracting turnover. These values will be used to calculate the emissions intensity of the company.

Example:
\`\`\`json
{
  "companyName": "Company AB",
  "turnover": [
    {"year": 2021, "value": 1000000, "currency": "mSEK"}
  ]
}
\`\`\`
`

export default turnover
