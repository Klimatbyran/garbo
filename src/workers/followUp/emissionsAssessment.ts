import { z } from 'zod'

import { assessmentResultSchema } from '../../jobs/emissions/schema'

export const prompt = `
You are an expert in corporate emissions reporting and GHG Protocol. Analyze the provided emissions data and assess its reasonability.

Consider:
1. Are the reported numbers reasonable for this type of company and industry?
2. Are there any obvious calculation errors or unit conversion mistakes?
3. Is scope 3 reporting complete and reasonable given the company's industry?
4. Are there any suspicious patterns or inconsistencies in the data?
5. If multiple years of data are provided, analyze year-over-year changes:
   - Are the reductions or increases reasonable given the company's industry and size?
   - Typical annual reductions are usually between 5-15% for most companies
   - Reductions above 30% in any of the categories (scope 1, 2, 3) should be flagged unless there's a clear explanation
   - Sudden increases should be investigated
   - Consider the company's decarbonization strategy and targets

Provide your assessment in this format:
{
  "assessment": {
    "isReasonable": true/false,
    "confidence": 0-1 (your confidence in this assessment, use a value between 0 and 1),
    "issues": [
      {
        "type": "MISSING_DATA"/"CALCULATION_ERROR"/"SCOPE_MISSING"/"UNIT_ERROR"/"UNREASONABLE_REDUCTION"/"OTHER",
        "description": "Detailed description of the issue",
        "severity": "LOW"/"MEDIUM"/"HIGH",
        "suggestedAction": "Optional suggestion for resolving the issue",
        "reportedNumber": "The number that was reported",
        "correctNumber": "An estimated number that should have been reported",
        "yearComparison": {
          "previousYear": "The previous year in the comparison",
          "currentYear": "The current year in the comparison",
          "reduction": "The percentage reduction between years"
        }
      }
    ],
    "reasoning": "Detailed explanation of your assessment",
    "nextSteps": [
      {
        "type": "VERIFY_CALCULATION"/"REQUEST_SCOPE3"/"CLARIFY_UNITS"/"OTHER",
        "description": "Description of recommended next step",
        "priority": "LOW"/"MEDIUM"/"HIGH"
      }
    ]
  }
}`

const queryTexts = [
  'GHG emissions data',
  'Scope 1 2 3 emissions',
  'Carbon footprint calculation methodology',
  'Emission factors used',
  'Scope 3 categories reported',
  'Emission calculation assumptions',
  'Year-over-year emissions changes',
  'Emissions reduction targets',
  'Decarbonization strategy'
]

export default { prompt, schema: assessmentResultSchema, queryTexts }