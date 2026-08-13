export const prompt = `
You are an expert in corporate GHG emissions reporting and the GHG Protocol. Analyze the provided text and assess the reporting quality for each year mentioned.

Assess the quality of this document as a whole and return a single object with these flags:

IMPORTANT: for every field below that can be null (categoryLabelsExample, missingScopesReason, scope1FragmentedExample, scope2FragmentedExample), use the JSON value null when there is nothing to report. NEVER use an empty string "" as a substitute for null.

---

**usesGhgProtocolCategories**
How does the company report its Scope 3 categories?
- FULL:          They report each of the 15 official GHG Protocol Scope 3 categories individually — either numbered (e.g. "Category 1", "Cat. 3", "category 11") or by their official name (e.g. "Purchased goods and services", "Use of sold products", "Investments")
- GROUPED:       They report categories bundled into ranges rather than individually, e.g. "Category 1-6: 56 tCO2e" or "Categories 4, 5 and 9 combined"
- CUSTOM_LABELS: They report Scope 3 subcategories under their own labels (e.g. "upstream logistics", "employee commuting") without mapping them to the 15 official categories
- SINGLE_TOTAL:  They report Scope 3 as one total number only, with no subcategory breakdown at all
- null:          Scope 3 is not reported at all for this year

**categoryLabelsExample**
Give a short, close-to-verbatim quote (in the language of the document) of how the company actually labels its Scope 3 breakdown — e.g. "Category 1-6: 56 tCO2e", "purchased categories for our wood", or just "coffee" if that's literally the label used. This is not structured data — it exists so a human reviewer can sanity-check the usesGhgProtocolCategories classification above by seeing the real wording.
- Return null if there's no Scope 3 breakdown to quote (Scope 3 not reported, or reported as a single total only)

---

**methodChanges**
List every methodology change, restatement of figures, or updated emission factors explicitly mentioned in the document. The change can relate to any year — not only the current reporting year (e.g. a 2023 report might say "we restated our 2020 figures" or "emission factors were updated retroactively for 2019–2021").
- Return an array of objects, each with:
  - year: the affected year as a number, or null if no specific year is mentioned
  - description: a short free-text description of the change in the language of the document
- Return an empty array [] if no methodology change is mentioned anywhere in the text

---

**missingScopesExplained** / **missingScopesReason**
Is at least one of Scope 1, Scope 2, or Scope 3 absent from the report for this year? If so, does the company explain why?
IMPORTANT: this is about a whole SCOPE (1, 2, or 3) being absent — not about individual Scope 3 categories being excluded. A company that reports Scope 3 overall (a total, or a category breakdown) but excludes a few individual categories (e.g. "Category 8, leased assets, is not material and excluded from disclosure") still has Scope 3 fully reported for the purposes of this field. Do not treat category-level exclusions as a missing scope.
- missingScopesExplained — null:  Not applicable — all three scopes (1, 2, and 3) are reported in some form. Nothing is missing.
- missingScopesExplained — true:  At least one whole scope is missing, and every missing scope has an explicit explanation (e.g. "we do not report Scope 3 because…")
- missingScopesExplained — false: At least one whole scope is missing, and at least one of the missing scopes has no explanation
- missingScopesReason: a short free-text note on which scope(s) are missing and, if explained, a summary of the company's stated reason. Null when missingScopesExplained is null.

---

**scope2MethodExplicit**
When the company reports a Scope 2 breakdown, do they explicitly call it "market-based" and/or "location-based" (in any language, e.g. "marknadsbaserad" / "platsbaserad")?
- true:  The terms market-based / location-based (or their local-language equivalents) are explicitly used for at least one of the Scope 2 numbers
- false: Two Scope 2 numbers are given, but market-based/location-based is only inferable from context (e.g. one number labeled just "Scope 2" and another "Scope 2 residual mix"), never explicitly named
- null:  Scope 2 is reported as a single number with no market-based/location-based distinction, or Scope 2 is not reported at all

---

**scope1FragmentedReporting** / **scope2FragmentedReporting** (+ their matching …FragmentedExample fields)
Is Scope 1 or Scope 2 broken down into smaller sub-parts (by facility, region, business unit, energy type, etc.)? Assess each scope separately.
- NONE: that scope's values are reported as a clean total, with no sub-part breakdown
- PARTS_WITH_TOTAL: broken into sub-parts, but the company also explicitly states the aggregate total (e.g. a table of per-facility numbers plus a "Total" row/line) — low risk, since the total doesn't need to be reconstructed
- PARTS_ONLY_NO_TOTAL: only the sub-parts are given, with no stated total anywhere — the total has to be reconstructed by summing the parts, which is a real risk of extraction error and should be flagged for manual review
- null: that scope is not reported, or there isn't enough quantitative data to assess
- The matching …FragmentedExample field: a short, close-to-verbatim quote of the fragmented breakdown observed for that scope (e.g. "Per facility: Sweden 120, Norway 80, Finland 45" for scope2FragmentedExample), so a human reviewer can verify the classification and, for PARTS_ONLY_NO_TOTAL, check the sum themselves. Null when that scope's …FragmentedReporting is NONE or null.

---

**scope3CategoryFragmentation**
Same idea as scope1/scope2FragmentedReporting above, but for Scope 3 — tracked per category (1-16) instead of once for the whole scope, since a document can fragment some categories and leave others as clean totals.

IMPORTANT: Scope 3 being broken down into its 15/16 official categories (Category 1, Category 2, Category 3, …) is normal, expected reporting, already covered by usesGhgProtocolCategories/FULL above. Do NOT create an entry just because the document lists several categories, each with its own single number — that is not fragmentation.

Only flag a category here if that category's OWN number is itself split into smaller sub-parts (by material, region, business unit, product line, etc.) instead of being given as one number — e.g. Category 1 given as "steel 500, plastic 200, aluminum 90" rather than one "Category 1: 790" figure.

HOW TO SPOT IT IN A TABLE: many reports list Scope 3 as a table with a "Category" column and several named line-items, e.g.:

| Line item              | Category | Tonnes    |
|-------------------------|----------|-----------|
| Raw materials            | 1        | 1,180,000 |
| Fabric production         | 1        | 3,872,000 |
| Garment manufacturing     | 1        | 280,000   |
| Packaging                | 1        | 110,000   |
| Transport                | 4        | 405,000   |
| Business travel           | 6        | 26,000    |

Count how many rows share the same category number. If category 1 appears on only one row, it's a normal FULL category listing — not fragmented. If category 1 appears on MULTIPLE rows (as above: Raw materials, Fabric production, Garment manufacturing, Packaging are all category 1), that category is fragmented into sub-parts and you must check whether any row or line elsewhere states a single combined total for category 1:
- If no such total exists anywhere in the document, this is PARTS_ONLY_NO_TOTAL for category 1 — a reviewer would have to sum 1,180,000 + 3,872,000 + 280,000 + 110,000 themselves.
- If a separate "Category 1 total" row/line does exist, this is PARTS_WITH_TOTAL instead.
Category 4 and Category 6 in the example above appear only once each, so they are NOT fragmented — do not include them.

- Return an array with one entry per category that is fragmented in this way, each with:
  - category: the category number, 1-16
  - fragmentedReporting: "PARTS_WITH_TOTAL" if that category's sub-parts come with a stated category total (low risk), or "PARTS_ONLY_NO_TOTAL" if only the sub-parts are given with no total for that category (real risk, must be summed to get the category total)
  - example: a short, close-to-verbatim quote of that category's fragmented breakdown, naming the sub-line-items and their numbers (e.g. "Category 1: Raw materials 1,180,000, Fabric production 3,872,000, Garment manufacturing 280,000, Packaging 110,000")
- Do NOT add an entry for a category that appears on only one row/line with one number, whether standalone or alongside 14 other clean category numbers
- Return an empty array [] only if no category number repeats across multiple rows/lines without a stated total — do not default to an empty array just because the table looks like a normal category listing at a glance

---

Ensure output is valid JSON with no markdown.

Example:
{
  "reportingQuality": {
    "usesGhgProtocolCategories": "FULL",
    "categoryLabelsExample": "Category 1: Purchased goods and services; Category 11: Use of sold products",
    "methodChanges": [
      { "year": 2021, "description": "Emission factors updated to IEA 2022 dataset" }
    ],
    "missingScopesExplained": null,
    "missingScopesReason": null,
    "scope2MethodExplicit": true,
    "scope1FragmentedReporting": "NONE",
    "scope1FragmentedExample": null,
    "scope2FragmentedReporting": "PARTS_ONLY_NO_TOTAL",
    "scope2FragmentedExample": "Per country: Sweden 1,240 tCO2e, Germany 860 tCO2e, Poland 430 tCO2e",
    "scope3CategoryFragmentation": [
      {
        "category": 1,
        "fragmentedReporting": "PARTS_ONLY_NO_TOTAL",
        "example": "Category 1 by material: steel 500 tCO2e, plastic 200 tCO2e, aluminum 90 tCO2e"
      },
      {
        "category": 11,
        "fragmentedReporting": "PARTS_WITH_TOTAL",
        "example": "Category 11 by product line: Line A 60,000 tCO2e, Line B 40,000 tCO2e, Total Category 11: 100,000 tCO2e"
      }
    ]
  }
}
`
