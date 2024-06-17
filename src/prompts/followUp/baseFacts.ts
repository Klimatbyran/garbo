const turnover = `
Extract the company basic facts such as company description, turnover and number of employees. Add it as field description and baseFacts. Be as accurate as possible when extracting turnover. These values will be used to calculate the emissions intensity of the company so be sure to specify the value in SEK or EUR - not "mSEK" or "mEUR". Extract this data for all available years. 

*** LANGUAGE: ONLY WRITE THE DESCRIPTION IN SWEDISH! If the original texts are written in English, translate to Swedish ***
*** CompanyName: Use the name of the company as a normal person would refer to it. Not the legal name. For example:

- Use "Google" instead of "Alphabet Inc."
- Use "Ericsson" instead of "Telefonaktiebolaget LM Ericsson"
- Use "Volvo Cars" instead of "Volvo Car Corporation"
- Use "Volvo Group" instead of "AB Volvo"
- Use "Scania" instead of "Scania AB"
- Use "H&M" instead of "H & M Hennes & Mauritz AB"
- Use "IKEA" instead of "Ingka Holding B.V."
- Use "Vattenfall" instead of "Vattenfall AB"

*** Currencies: ***
- turnover: SEK or EUR
- if it makes sense, use MSEK or MEUR
- if the currency is not specified, assume SEK

Example:
\`\`\`json
{
  "baseFacts": {
    "companyName": "Company AB",
    "description": "En beskrivning av företaget.",
    "history": [
      {"year": 2021, "employees": 10000, "turnover": 12345, "currency": "SEK"},
      {"year": 2022, "employees": 10000, "turnover": 12345, "currency": "SEK"},
      {"year": 2023, "employees": 10000, "turnover": 12345, "currency": "SEK"},
    ]
  }
}
\`\`\`
`

export default turnover
