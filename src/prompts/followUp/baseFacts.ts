import { z } from 'zod'

export const schema = z.object({
  baseFacts: z.object({
    companyName: z.string(),
    description: z.string(),
    history: z.array(
      z.object({
        year: z.number(),
        employees: z.number(),
        turnover: z.number(),
        currency: z.string(),
      })
    ),
  }),
})

export const prompt = `
Extract the company basic facts such as company description, turnover and number of employees. Add it as field description and baseFacts. Be as accurate as possible when extracting turnover. These values will be used to calculate the emissions intensity of the company so be sure to specify the value in SEK or EUR - not "mSEK" or "mEUR". Extract this data for all available years. 

*** CompanyName: Use the name of the company as a normal person would refer to it. Not the legal name. For example:

- Use "Google" instead of "Alphabet Inc."
- Use "Ericsson" instead of "Telefonaktiebolaget LM Ericsson"
- Use "Volvo Cars" instead of "Volvo Car Corporation"
- Use "Volvo Group" instead of "AB Volvo"
- Use "Scania" instead of "Scania AB"
- Use "H&M" instead of "H & M Hennes & Mauritz AB"
- Use "IKEA" instead of "Ingka Holding B.V."
- Use "Vattenfall" instead of "Vattenfall AB"

*** Turnover ***
- Use the turnover field to specify the turnover (intäkter, omsättning) of the company. If the currency is not specified, assume SEK.

*** Currencies: ***
- turnover: SEK or EUR
- if it makes sense, use MSEK or MEUR
- if the currency is not specified, assume SEK

*** Dates: ***
- if no year is specified, assume the current year ${new Date().getFullYear()}

** Description **
Beskrivning av företaget. Tänk på att vara så informativ som möjligt. Den här texten ska visas på en sida
för hållbarhetsredovisning så det är viktigt att den är informativ och beskriver företaget väl men inte tillåter
texter som kan uppfattas som greenwashing eller marknadsföring. Många företag är okända för allmänheten så det
är viktigt att beskrivningen är informativ och beskriver företaget väl.

*** LANGUAGE: ONLY WRITE THE DESCRIPTION IN SWEDISH! If the original texts are written in English, translate to Swedish ***

Example, follow the format below:
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

export default { prompt, schema }
