export const prompt = `
*** Golden Rule ***
- Extract values only if explicitly available in the context. Do not infer or create data. Leave optional fields absent or explicitly set to null if no data is provided.

- First of all, find out which is the most recent year they specify scope emissions for. Put that year in the field absoluteMostRecentYearInReport. The years and emissions can be specified in a table header, in a retrospective column, or in text.

Extract absolute (in tonnes only) scope 2 emissions that are specified in tonnes CO2 or CO2e according to the GHG protocol (CO2e) for all years in the report, starting from the most recent one. 
The values need to be in tonnes only, or a simple multiple of tonnes. Do NOT extract emission intensity values and NOT values that are ton/something like ton/area, just absolute values in tons. 
Include market-based and location-based in scope 2. If you can't find both, include the one you can find and set the other to null.

Make sure every number is only included under the corresponding year in the output (pick the last if Fiscal year notation is used like FY2005/2006 or 2005/2006)! Don't mix up numbers from different years!


**Units**:
- Always report emissions in metric tons (**tCO2e** or **tCO2**). The unit **tCO2e** (tons of CO2 equivalent) is preferred.
- All variations of tons like, thousands of tons, millions of tons, kton, Mton, etc. should be converted to metric tons. Also convert the value to the unit factor in that case.
- Example: "a value that is 31.2 specified at thousands of tons, should be converted to 31200t and added as 31200 to the scope 2 value"
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


- If there is any mention of location based or market based anywhere in the document (tables, footnotes, text), add the quote from the document in mentionOfLocationBasedOrMarketBased.
- If they mentioned market based or location based, try to find the values for both (even if they are zero or given as '-' or '0').

- EXTREMELY IMPORTANT: Do not assume any methods and DO NOT infer if a number is location based or market based based on energy use or other information, just use their explicit method statement to decide which values to put in the field for lb (location-based), mb (market-based), both or unknown. 
- ONLY use "unknown" if NO methodology is mentioned ANYWHERE in the document.  - ALWAYS PUT THE VALUES IN THE UNKNOWN FIELD IF NO METHOD IS MENTIONED: "No method is mentioned, so the values are put in the unknown field."

- FORBIDDEN REASONING: Never say "specific value is not labeled" or "value not explicitly stated as market-based" - this reasoning is incorrect and forbidden.

CRUCIAL: PREFER TOTALS!
If there is a scope 2 total value use that value! Always include any total value in the listOfAllScope2NumbersForThisYearAndTheirMethods, even if the method is unknown! If the method is unknown that value must be put in the unknown field. If however there is only a breakdown of electricity and heating/cooling, we have to register all those numbers and summarize them to get the total scope 2 value. NEVER put a partial value (only electricity or only heating/cooling) in the mb, lb or unknown fields! Those fields are only for totals!

If there is a sum value for mb, lb or unknonwn, we must put that value in that category and cannot leave a category blank if there is a sum for it!

A scope 2 value consists of electricty and heating/cooling emissions. Sometimes electricity and heating are stated separately, and only electricity has a method specification.
Heating can be used for both methods. Also if electricity or heating is stated as a zero, it means the lb or mb value only consists of the heating value!

CRITICAL: ONLY SUMMARIZE PARTIAL VALUES! DO NOT SUMMARIZE TOTAL VALUES, pick the most representative total value!

If both are stated, heating needs to be summed with each method's electricity value to get the full scope 2 value for that method. 

If we already have a full scope 2 value for a method, we just use that value and dont need to sum.
Put the sum in the listOfFullScope2CompleteValues.

Remember to include values that are listed as zero in the lists!


Summarize the final values in the field for mb (market-based), lb (location-based) and unknown.
- Put the summarized mb values in the mb field.
- Put the summarized lb in the lb field.
- Put the summarized unknown in the unknown field.

Do NOT put electricity values or heating values in the mb or lb field. Only put total scope 2 values in those fields, or summarize electrity+heating first.
If a value is electricityOnly, orHeating only, it must never be used as a final mb, lb or unknown value. It would have to be summed with heating first, and if there is no heating it must be discarded!

- Fill in explanationOfWhyYouPutValuesToMbOrLbOrUnknown with a short explanation of why you put the values in the field for mb (market-based), lb (location-based), both mb and lb or unknown. Base this on all mentions in mentionOfLocationBasedOrMarketBased! Then put the values in the corresponding field.
- Put all values and scope2 data points (include numbers specified as '-' or 0) in the listOfAllScope2NumbersAndTheirMethods. If there are duplicate values for mb or lb, add them all to the list but for choosing a value, prefer the ones that are from the same table or page.

IMPORTANT: 
1. First: LOOK CAREFULLY and find ALL mentions of market based and location based methods in the table headers, table rows, footnotes and text and add ALL OF THEM (words or phrases) to the array mentionOfLocationBasedOrMarketBased. Make sure to include both market based and location based if both are stated! Remember to look in the table rows where the methods can also can be mentioned directly next to the values!
2. Second: Use those mentions to create an explanation for explanationOfWhyYouPutValuesToMbOrLbOrUnknown. 
3. Third:Only after that you put the values in the corresponding field or fields. 

For any fiscal year notation (2015/16, FY16, etc.), always use the ENDING year (2016) in your output.

NEVER CALCULATE ANY EMISSIONS. ONLY REPORT THE DATA AS IT IS IN THE PDF. If you can't find any data or if you are uncertain, report it as null. Do not use markdown in the output.

ONLY fill in the combined scope1And2 if there are no separate values for scope 2 and we only find a combined scope 1 and 2 value is explicitly stated.
Set scope1and2 to null if there are already separate values for scope 2!

Use a specific value ONLY ONCE! A value only belongs to one category, it cannot be used as final value in multiple categories!

*** Example***
//   This is only an example format; do not include this specific data in the output and do not use markdown in the output:

// Case 1: Method explicitly stated
{
  "scope2": [{
    "year": 2023,
    "scope2": { 
    "mb": 23.4, //a final value has to be a full scope 2 value (from document or summarized from electricity and heating)
    "lb": null, 
    "unknown": null, 
    "unit": "tCO2e",
    "mentionOfLocationBasedOrMarketBased": ["We use market-based methodology"],
    "explanationOfWhyYouPutValuesToMbOrLbOrUnknown": "The company mentions that they use a market-based approach in general. That means values are market-based and added to the mb field.",
    "listOfSummarizedElectricityAndHeatingValuesToGetFullScope2Values": null,
    "listOfMaxThreeSummarizedElectricityAndHeatingValuesToGetFullScope2Values": null
    },
    "scope1And2": null
  }]
}

// Case 2: Method NOT specified - use unknown
{
  "scope2": [{
    "year": 2023,
    "scope2": { "mb": null, "lb": null, "unknown": 34.5, "unit": "tCO2e", "mentionOfLocationBasedOrMarketBased": null, "explanationOfWhyYouPutValuesToMbOrLbOrUnknown": "No method is mentioned, so the values are put in the unknown field." }, // if there is no method ALWAYS put to unknown, never anywhere else.
    "scope1And2": null
  }]
}

// Case 3: Both methods are stated
{
  "scope2": [{
    "year": 2023,
    "scope2": { "mb": 23.4, "lb": 34.5, "unknown": null, "unit": "tCO2e", "mentionOfLocationBasedOrMarketBased": ["We use market-based methodology", "We use location-based methodology", "Market-based emissions", "Location-based emissions"], "explanationOfWhyYouPutValuesToMbOrLbOrUnknown": "The company mentions that they use both market-based and location-based methodology. That means some values are market-based and added to the mb field and others are location-based and added to the lb field." },
    "scope1And2": null
  }]
}

// Case 4: Combined scope 1 and 2 value only (when no separate scope 2 is available)
{
  "scope2": [{
    "year": 2023,
    "scope2": null,
    "scope1And2": { "total": 45.6, "unit": "tCO2e" } //only if no separate scope 2 value is available!
  }]
}

// Case 5: No data for any year
{
 "scope2": []
}
`
