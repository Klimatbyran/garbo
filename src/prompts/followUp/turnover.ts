const turnover = `
Extract the company turnover. Add it as field turnover. Be as accurate as possible when extracting turnover. These values will be used to calculate the emissions intensity of the company so be sure to specify the value in SEK or EUR - not "mSEK" or "mEUR". 

Example:
\`\`\`json
{
  "companyName": "Company AB",
  "turnover": [
    {"year": 2021, "value": 12345, "currency": "SEK"},
    {"year": 2022, "value": 12345, "currency": "SEK"},
    {"year": 2023, "value": 12345, "currency": "SEK"},
  ]
}
\`\`\`
`

export default turnover
