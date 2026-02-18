

export const prompt = `
*** Golden Rule ***
- Extract values only if explicitly available in the context. Do not infer or create data. Leave optional fields absent or explicitly set to null if no data is provided.

- First of all, find out which is the most recent year they specify scope emissions for. Put that year in the field absoluteMostRecentYearInReport. The years and emissions can be specified in a table header, in a retrospective column, or in text.

Extract absolute (in tonnes only) scope 1 emissions that are specified in tonnes CO2 or CO2e according to the GHG protocol (CO2e) for all years in the report, starting from the most recent one. 
The values need to be in tonnes only, or a simple multiple of tonnes. Do NOT extract emission intensity values and NOT values that are ton/something like ton/area, just absolute values in tons.

**Units**:
- Always report emissions in metric tons (**tCO2e** or **tCO2**). The unit **tCO2e** (tons of CO2 equivalent) is preferred.
- All variations of tons like, thousands of tons, millions of tons, kton, Mton, etc. should be converted to metric tons. Also convert the value to the unit factor in that case.
- Example: "a value that is 31.2 specified at thousands of tons, should be converted to 31200t and added as 31200 to the scope 1 value"
- If you see mention of them using some factor of "tons', you must convert the value, multiply with the factor to get to "tons".
- If a company explicitly reports emissions without the "e" suffix (e.g., **tCO2**), use **tCO2** as the unit. However, if no unit is specified or it is unclear, assume the unit is **tCO2e**.
- All values must be converted to metric tons if they are provided in other units:
  - Example: 
    - 1000 CO2e → 1 tCO2e
    - 1000 CO2 → 1 tCO2
    - 1 kton CO2e → 1000 tCO2e
    - 1 Mton CO2 → 1,000,000 tCO2
    - 1 CO2/area -> IMPORTANT! DO NOT INCLUDE THIS IN THE OUTPUT, not pure tonnes
    - 1 CO2e/revenue / intensity -> IMPORTANT! DO NOT INCLUDE THIS IN THE OUTPUT, not pure tonnes
- Use **tCO2** only if it is explicitly reported without the "e" suffix, otherwise default to **tCO2e**.

Always expand abbreviated units to their full numerical value. Convert:

X thousand tons → X × 1,000 tons
X million tons → X × 1,000,000 tons
etc.
Example: '3.1 thousand tons' should become '3,100 tons', not be left as '3.1 thousand tons

For any fiscal year notation (2015/16, FY16, etc.), always use the ENDING year (2016) in your output.

NEVER CALCULATE ANY EMISSIONS. ONLY REPORT THE DATA AS IT IS IN THE PDF. If you can't find any data or if you are uncertain, report it as null. Do not use markdown in the output.

Only fill in scope1And2 if there are no separate values for scope 1 and only a combined scope 1 and 2 value is explicitly stated.

Use a specific value ONLY ONCE! A value only belongs to one category, it cannot be used as final value in multiple categories!

In the listOfAllPossibleScope1Numbers, include all possible values that you can find, even if you end up not using them in the output. We want all possible sources here for reference later.

*** Example***
//   This is only an example format; do not include this specific data in the output and do not use markdown in the output:

// Case 1: Scope 1 data available
{
  "scope1": [{
    "year": 2023,
    "listOfAllPossibleScope1Numbers": [
      {
        "number": 12.3,
        "unit": "tCO2e",
        "comment": "Scope 1 emissions for 2023",
        "sourceText": "Scope 1 emissions for 2023"
      },
      {
        "number": 11.8, //also include alternative numbers that you end up not using in the output, we want all possible sources here.
        "unit": "tCO2e/m2",
        "comment": "Scope 1 emissions for 2022",
        "sourceText": "Scope 1 emissions for 2022, intensity per square meter of office area"
      }
    ],
    "scope1": { "total": 12.3, "unit": "tCO2e" },
    "scope1And2": null
  }]
}

// Case 2: Multiple years of data
{
  "scope1": [{
    "year": 2023,
    "scope1": { "total": 12.3, "unit": "tCO2e" },
    "scope1And2": null
  }, {
    "year": 2022,
    "scope1": { "total": 11.8, "unit": "tCO2e" },
    "scope1And2": null
  }]
}

// Case 3: Combined scope 1 and 2 value only (when no separate scope 1 is available)
{
  "scope1": [{
    "year": 2023,
    "scope1": null,
    "scope1And2": { "total": 45.6, "unit": "tCO2e" }
  }]
}

// Case 4: No data for any year
{
 "scope1": []
}
`