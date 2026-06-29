const currentYear = new Date().getFullYear()

export const turnoverPrompt = `
*** Turnover ***
- Extract turnover as a numerical value. Use the turnover field for consolidated company turnover (omsättning, nettoomsättning, net sales, net turnover).
- If the currency is not specified, assume SEK.
- Be as accurate as possible. Extract this data for all available years.
- Prefer consolidated group figures over segment or line-item figures.
- Convert units like "MSEK", "kSEK", "kEUR", "SEKm", "EURm" etc. into the base numerical value in the local currency.
  Example:
  - 250 MSEK → 250000000 SEK
  - 4.2 KEUR → 4200 EUR
- Specify the **currency** as a separate field (e.g., SEK, USD, EUR).
`

export const revenuePrompt = `
*** Revenue (intäkter) ***
- Extract revenue as a separate numerical value. Use the revenue field for consolidated company revenue (intäkter, totala intäkter, total revenue, net revenue) when it is reported as an absolute monetary amount.
- If the currency is not specified, assume SEK.
- Be as accurate as possible. Extract this data for all available years.
- Prefer consolidated group figures over segment or line-item figures.
- Apply the same unit conversion rules as turnover (MSEK, kSEK, kEUR, SEKm, EURm → base currency amount).
- Specify the **currency** as a separate field (e.g., SEK, USD, EUR).
`

export const profitPrompt = `
*** Profit (vinst) ***
- Extract profit as a separate numerical value. Use the profit field for consolidated company profit when reported as an absolute monetary amount.
- Map labels such as vinst, rörelseresultat, rörelsevinst, EBIT, operating profit, resultat före skatt, profit before tax, årets resultat, resultat efter skatt, net income, and net profit.
- If multiple consolidated profit figures exist for the same year, prefer in this order: net profit (årets resultat / resultat efter skatt / net income), then profit before tax, then operating profit (rörelseresultat / EBIT).
- Profit may be negative (förlust / loss). Preserve the sign.
- If the currency is not specified, assume SEK.
- Be as accurate as possible. Extract this data for all available years.
- Prefer consolidated group figures over segment or line-item figures.
- Apply the same unit conversion rules as turnover (MSEK, kSEK, kEUR, SEKm, EURm → base currency amount).
- Specify the **currency** as a separate field (e.g., SEK, USD, EUR).
- Do NOT extract profit margins or ratios (e.g. EBIT %, EBITDA %, vinstmarginal).
`

export const disambiguationPrompt = `
*** Turnover vs revenue vs profit ***
- Turnover, revenue, and profit are related but not always identical. Keep them in separate fields.
- Map to turnover when the source label is omsättning, nettoomsättning, net sales, or net turnover.
- Map to revenue when the source label is intäkter, totala intäkter, total revenue, or net revenue (as an absolute amount, not a ratio).
- Map to profit when the source label is vinst, rörelseresultat, resultat före/efter skatt, net income, or similar consolidated profit figures.
- If the report uses only one consolidated label for a metric, fill only the matching field. Do not duplicate the same figure into multiple fields unless the report explicitly uses multiple labels for the same total.
- Do NOT extract:
  - Emission or energy intensity denominators (e.g. tCO2e/nettointäkt, tCO2e per net revenue, MWh/SEK).
  - Segment, product, or line-item intäkter (e.g. hyresintäkter, resenärsrelaterade intäkter) when a consolidated group total is available elsewhere.
  - Accrued or prepaid intäkter (upplupna/förutbetalda intäkter).
  - Gross profit, EBITDA, or other subtotals unless they are clearly the only consolidated profit figure for the company.
`

export const employeesPrompt = `
*** Employees ***
- Extract the number of employees for all available years.
- Acceptable units include:
  - FTE (Full-Time Equivalent)
  - AVG (genomsnittligt antal anställda)
  - EOY (Antal anställda vid årets slut)
- If no unit is specified, extract the value as is and set the unit field to null.
`

export const prompt = `
*** Golden Rule ***
- Extract values only if explicitly available in the context. Do not infer or create data. Leave optional fields absent or explicitly set to null if no data is provided.
${turnoverPrompt}
${revenuePrompt}
${profitPrompt}
${disambiguationPrompt}
${employeesPrompt}
*** Dates: ***
- if no year is specified, assume the current year ${currentYear}

*** Example***
This is only an example format; do not include this specific data in the output and do not use markdown in the output:
{
  "economy": [
    {
      "year": 2023,
      "economy": {
        "turnover": {
          "value": 4212299000,
          "currency": "SEK"
        },
        "revenue": {
          "value": 4213500000,
          "currency": "SEK"
        },
        "profit": {
          "value": 512000000,
          "currency": "SEK"
        },
        "employees": {
          "value": 3298,
          "unit": "FTE"
        }
      }
    },
    {
      "year": 2022,
      "economy": {
        "turnover": {
          "value": 3993948000,
          "currency": "SEK"
        },
        "employees": {
          "value": 3045,
          "unit": "AVG"
        }
      }
    }
  ]
}
`
