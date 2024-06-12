const turnover = `
Extract the company basic facts such as company description, turnover and number of employees. Add it as field description and baseFacts. Be as accurate as possible when extracting turnover. These values will be used to calculate the emissions intensity of the company so be sure to specify the value in SEK or EUR - not "mSEK" or "mEUR". Extract this data for all available years. 

*** LANGUAGE: ONLY WRITE THE DESCRIPTION IN SWEDISH! If the original texts are written in English, translate to Swedish ***

Example:
\`\`\`json
{
  "companyName": "Company AB",
  "description": "En beskrivning av företaget.",
  "baseFacts": [
    {"year": 2021, "employees": 10000, "turnover": 12345, "currency": "SEK"},
    {"year": 2022, "employees": 10000, "turnover": 12345, "currency": "SEK"},
    {"year": 2023, "employees": 10000, "turnover": 12345, "currency": "SEK"},
  ]
}
\`\`\`
`

export default turnover
