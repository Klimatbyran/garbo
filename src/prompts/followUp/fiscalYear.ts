// TODO: This needs to be updated to handle reporting periods (which is similar but not exactly the same as fiscal years).

const fiscalYear = `
Extract the company fiscal year. Sometimes companies have broken fiscal year.  Example: 1 apr -> 31 mar means: startMonth = 4, endMonth = 3. Standard is 1 jan -> 31 dec. 

Example:
\`\`\`json
{
  "companyName": "Company AB",
  "fiscalYear": {startMonth: 1, endMonth: 12}
}
\`\`\`
`

export default fiscalYear
