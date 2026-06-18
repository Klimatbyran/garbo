export const prompt = `
*** Golden Rule ***
Extract values only if explicitly available in the context. Do not infer or create data. Leave optional fields absent or explicitly set to null if no data is provided.

Extract the overall stated total GHG emissions (the grand total across all scopes) for all years in the report, starting from the most recent one.

This is the single number the company presents as their total carbon footprint or total GHG emissions — typically labelled "Total GHG emissions", "Total carbon footprint", "Total emissions (Scope 1+2+3)", or similar. It must cover more than one scope to qualify; do NOT report a scope-specific total here.

**Units**:
- Always report in metric tons (tCO2e or tCO2). tCO2e is preferred.
- Convert all multiples (thousands, millions, kton, Mton, etc.) to metric tons and adjust the value accordingly.
- Example: 31.2 thousand tons → 31200, unit tCO2e.
- If the company explicitly omits the "e" suffix use tCO2; otherwise default to tCO2e.
- Do NOT include intensity values (ton/revenue, ton/area, etc.).

**Method — is the total derived using market-based or location-based scope 2?**
Since the grand total includes scope 2, the total can be stated separately for market-based and/or location-based scope 2 approaches:
- Put the value in "mb" if the total is explicitly stated as using market-based scope 2.
- Put the value in "lb" if the total is explicitly stated as using location-based scope 2.
- Put the value in "unknown" ONLY if no scope 2 method is mentioned anywhere in the document in relation to the total figure.
- A company can have both "mb" and "lb" totals — put them both.

EXTREMELY IMPORTANT:
- Do NOT infer the method from the scope 2 section alone. Only use "mb" or "lb" if the method is explicitly connected to the stated total figure.
- FORBIDDEN REASONING: Never say "specific value is not labeled" or "assume market-based because scope 2 is market-based elsewhere".
- ONLY use "unknown" if no methodology is mentioned ANYWHERE in the document for the total.

1. First: LOOK CAREFULLY and find ALL mentions of market-based and location-based methods in table headers, rows, footnotes, and text relating to the total. Add all quotes to mentionOfLocationBasedOrMarketBased.
2. Second: Write an explanation in explanationOfWhyYouPutValuesToMbOrLbOrUnknown based on those mentions.
3. Third: Put the value(s) in the corresponding field(s).

Set statedTotalEmissions to null if:
- No overall total is stated (only individual scopes are reported).
- The figure only covers one scope.
- The value is an intensity metric, not an absolute total.

For fiscal year notation (FY2015/16, 2015/2016), always use the ending year (2016).
Do not use markdown in the output.

*** Examples ***

// Case 1: Market-based total explicitly stated
{
  "totalEmissions": [
    {
      "year": 2023,
      "statedTotalEmissions": {
        "mb": 125000,
        "lb": null,
        "unknown": null,
        "unit": "tCO2e",
        "mentionOfLocationBasedOrMarketBased": ["Total GHG emissions (market-based)"],
        "explanationOfWhyYouPutValuesToMbOrLbOrUnknown": "The document labels the total emissions row as market-based."
      }
    }
  ]
}

// Case 2: Both market-based and location-based totals stated
{
  "totalEmissions": [
    {
      "year": 2023,
      "statedTotalEmissions": {
        "mb": 125000,
        "lb": 130000,
        "unknown": null,
        "unit": "tCO2e",
        "mentionOfLocationBasedOrMarketBased": ["Total (market-based)", "Total (location-based)"],
        "explanationOfWhyYouPutValuesToMbOrLbOrUnknown": "The company reports two total rows, one for each scope 2 method."
      }
    }
  ]
}

// Case 3: Total stated, no method mentioned
{
  "totalEmissions": [
    {
      "year": 2023,
      "statedTotalEmissions": {
        "mb": null,
        "lb": null,
        "unknown": 98500,
        "unit": "tCO2e",
        "mentionOfLocationBasedOrMarketBased": null,
        "explanationOfWhyYouPutValuesToMbOrLbOrUnknown": "No scope 2 method is mentioned for the total, so the value goes in the unknown field."
      }
    }
  ]
}

// Case 4: No overall total found
{
  "totalEmissions": [
    {
      "year": 2023,
      "statedTotalEmissions": null
    }
  ]
}

// Case 5: No data at all
{
  "totalEmissions": []
}
`
