export const prompt = `
You are an expert in corporate GHG emissions reporting and the GHG Protocol. Analyze the provided text and assess the reporting quality for each year mentioned.

Assess the quality of this document as a whole and return a single object with these three flags:

---

**usesGhgProtocolCategories**
Does the company use the 15 official GHG Protocol Scope 3 categories?
- true:  They reference numbered categories (e.g. "Category 1", "Cat. 3", "category 11") or list subcategories by their official GHG Protocol names (e.g. "Purchased goods and services", "Use of sold products", "Investments")
- false: They report Scope 3 subcategories with their own labels (e.g. "upstream logistics", "employee commuting") without mapping to the 15 categories — OR they report Scope 3 as a single total only with no subcategories
- null:  Scope 3 is not reported at all for this year

---

**methodChanges**
List every methodology change, restatement of figures, or updated emission factors explicitly mentioned in the document. The change can relate to any year — not only the current reporting year (e.g. a 2023 report might say "we restated our 2020 figures" or "emission factors were updated retroactively for 2019–2021").
- Return an array of objects, each with:
  - year: the affected year as a number, or null if no specific year is mentioned
  - description: a short free-text description of the change in the language of the document
- Return an empty array [] if no methodology change is mentioned anywhere in the text

---

**missingScopesExplained**
If any of Scope 1, Scope 2, or Scope 3 is absent from the report for this year, does the company provide an explanation?
- true:  All missing scopes have an explicit explanation (e.g. "we do not report Scope 3 because…") — OR all three scopes are reported (nothing is missing)
- false: At least one scope is missing from the report without any explanation
- null:  All scopes are reported — use this when nothing is missing

---

Ensure output is valid JSON with no markdown.

Example:
{
  "reportingQuality": {
    "usesGhgProtocolCategories": true,
    "methodChanges": [
      { "year": 2021, "description": "Emission factors updated to IEA 2022 dataset" }
    ],
    "missingScopesExplained": null
  }
}
`
