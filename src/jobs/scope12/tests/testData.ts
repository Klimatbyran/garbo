import { emissionUnitSchemaGarbo } from '@/api/schemas'
import z from 'zod'

export const oldSchema = z.object({
  scope12: z.array(
    z.object({
      year: z.number(),
      scope1: z
        .object({
          total: z.number(),
          unit: emissionUnitSchemaGarbo,
        })
        .nullable()
        .optional(),
      scope2: z
        .object({
          mb: z
            .number({ description: 'Market-based scope 2 emissions' })
            .nullable()
            .optional(),
          lb: z
            .number({ description: 'Location-based scope 2 emissions' })
            .nullable()
            .optional(),
          unknown: z
            .number({ description: 'Unspecified Scope 2 emissions' })
            .nullable()
            .optional(),
          unit: emissionUnitSchemaGarbo,
        })
        .refine(({ mb, lb, unknown }) => mb || lb || unknown, {
          message:
            'At least one property of `mb`, `lb` and `unknown` must be defined if scope2 is provided',
        })
        .nullable()
        .optional(),
    }),
  ),
})

export const newSchema = z.object({
  scope12: z.array(
    z.object({
      year: z.number(),
      scope1: z
        .union([
          z.object({
            total: z.number(),
            unit: emissionUnitSchemaGarbo,
          }),
          z.null(),
        ])
        .optional(),
      scope2: z
        .union([
          z
            .object({
              mb: z
                .union([
                  z.number({ description: 'Market-based scope 2 emissions' }),
                  z.null(),
                ])
                .optional(),
              lb: z
                .union([
                  z.number({ description: 'Location-based scope 2 emissions' }),
                  z.null(),
                ])
                .optional(),
              unknown: z
                .union([
                  z.number({ description: 'Unspecified Scope 2 emissions' }),
                  z.null(),
                ])
                .optional(),
              unit: emissionUnitSchemaGarbo,
            })
            .refine(({ mb, lb, unknown }) => mb || lb || unknown, {
              message:
                'At least one property of `mb`, `lb` and `unknown` must be defined if scope2 is provided',
            }),
          z.null(),
        ])
        .optional(),
    }),
  ),
})

// current 'best'
export const newSchemaWithInstructions = z.object({
  scope12: z.array(
    z.object({
      year: z.number(),
      scope1: z
        .union([
          z.object({
            total: z.number(),
            unit: emissionUnitSchemaGarbo,
          }),
          z.null(),
        ])
        .optional(),
      scope2: z
        .union([
          z
            .object({
              mentionOfLocationBasedOrMarketBased: z
                .union([z.string(), z.null()])
                .optional(),
              explanationOfWhyYouPutValuesToMbOrLbOrUnknown: z
                .string()
                .nullable()
                .optional(),
              mb: z
                .union([
                  z.number({ description: 'Market-based scope 2 emissions' }),
                  z.null(),
                ])
                .optional(),
              lb: z
                .union([
                  z.number({ description: 'Location-based scope 2 emissions' }),
                  z.null(),
                ])
                .optional(),
              unknown: z
                .union([
                  z.number({ description: 'Unspecified Scope 2 emissions' }),
                  z.null(),
                ])
                .optional(),
              unit: emissionUnitSchemaGarbo,
            })
            .refine(({ mb, lb, unknown }) => mb || lb || unknown, {
              message:
                'At least one property of `mb`, `lb` and `unknown` must be defined if scope2 is provided',
            }),
          z.null(),
        ])
        .optional(),
    }),
  ),
})

export const newSchemaWithInstructionsArrayOfExplanations = z.object({
  scope12: z.array(
    z.object({
      year: z.number(),
      scope1: z
        .union([
          z.object({
            total: z.number(),
            unit: emissionUnitSchemaGarbo,
          }),
          z.null(),
        ])
        .optional(),
      scope2: z
        .union([
          z
            .object({
              mentionOfLocationBasedOrMarketBased: z
                .union([z.array(z.string()), z.null()])
                .optional(),
              explanationOfWhyYouPutValuesToMbOrLbOrUnknown: z
                .string()
                .nullable()
                .optional(),
              mb: z
                .union([
                  z.number({ description: 'Market-based scope 2 emissions' }),
                  z.null(),
                ])
                .optional(),
              lb: z
                .union([
                  z.number({ description: 'Location-based scope 2 emissions' }),
                  z.null(),
                ])
                .optional(),
              unknown: z
                .union([
                  z.number({ description: 'Unspecified Scope 2 emissions' }),
                  z.null(),
                ])
                .optional(),
              unit: emissionUnitSchemaGarbo,
            })
            .refine(({ mb, lb, unknown }) => mb || lb || unknown, {
              message:
                'At least one property of `mb`, `lb` and `unknown` must be defined if scope2 is provided',
            }),
          z.null(),
        ])
        .optional(),
    }),
  ),
})

export const schemaRecency = z.object({
  scope12: z.array(
    z.object({
      absoluteMostRecentYearInReport: z.number(),
      year: z.number(),
      scope1: z
        .union([
          z.object({
            total: z.number(),
            unit: emissionUnitSchemaGarbo,
          }),
          z.null(),
        ])
        .optional(),
      scope2: z
        .union([
          z
            .object({
              mentionOfLocationBasedOrMarketBased: z
                .union([z.array(z.string()), z.null()])
                .optional(),
              listOfAllAvailableNumbersAndTheirMethods: z.union([
                z.array(
                  z.object({
                    number: z.number(),
                    method: z.string(),
                    specifiedScope: z.array(
                      z.enum(['scope1', 'scope2', 'scope3']),
                    ),
                    unit: z.string(),
                    comment: z.string(),
                  }),
                ),
                z.null(),
              ]),
              explanationOfWhyYouPutValuesToMbOrLbOrUnknown: z
                .string()
                .nullable()
                .optional(),
              mbValuesWeNeedToSum: z
                .union([z.array(z.number()), z.null()])
                .nullable()
                .optional(),
              lbValuesWeNeedToSum: z
                .union([z.array(z.number()), z.null()])
                .nullable()
                .optional(),
              unknownValuesWeNeedToSum: z
                .union([z.array(z.number()), z.null()])
                .nullable()
                .optional(),
              mb: z
                .union([
                  z.number({ description: 'Market-based scope 2 emissions' }),
                  z.null(),
                ])
                .optional(),
              lb: z
                .union([
                  z.number({ description: 'Location-based scope 2 emissions' }),
                  z.null(),
                ])
                .optional(),
              unknown: z
                .union([
                  z.number({ description: 'Unspecified Scope 2 emissions' }),
                  z.null(),
                ])
                .optional(),
              unit: emissionUnitSchemaGarbo,
            })
            .refine(({ mb, lb, unknown }) => mb || lb || unknown, {
              message:
                'At least one property of `mb`, `lb` and `unknown` must be defined if scope2 is provided',
            }),
          z.null(),
        ])
        .optional(),
    }),
  ),
})

// current "best"
export const recencyPrompt = `
*** Golden Rule ***
- Extract values only if explicitly available in the context. Do not infer or create data. Leave optional fields absent or explicitly set to null if no data is provided.

- First of all, find out which is the most recent year they specify scope emissions for. Put that year in the field absoluteMostRecentYearInReport.

Extract absolute scope 1 and 2 emissions according to the GHG protocol (CO2e) for all years in the report, starting from the most recent one. The values need to be in tonnes only, or a simple multiple of tonnes. 
Do NOT extract emission intensity values and NOT values that are ton/something like ton/area, just absolute values in tons. 
Include market-based and location-based in scope 2. If you can't find both, include the one you can find and set the other to null.

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
- Use **tCO2** only if it is explicitly reported without the "e" suffix, otherwise default to **tCO2e**.

Always expand abbreviated units to their full numerical value. Convert:

X thousand tons → X × 1,000 tons
X million tons → X × 1,000,000 tons
etc.
Example: '3.1 thousand tons' should become '3,100 tons', not be left as '3.1 thousand tons


- If there is any mention of location based or market based anywhere in the document (tables, footnotes, text), add the quote from the document in mentionOfLocationBasedOrMarketBased.

- EXTREMELY IMPORTANT: Do not assume any methods and DO NOT infer if a number is location based or market based based on energy use or other information, just use their explicit method statement to decide which values to put in the field for lb (location-based), mb (market-based), both or unknown. 
- ONLY use "unknown" if NO methodology is mentioned ANYWHERE in the document.  - ALWAYS PUT THE VALUES IN THE UNKNOWN FIELD IF NO METHOD IS MENTIONED: "No method is mentioned, so the values are put in the unknown field."

- FORBIDDEN REASONING: Never say "specific value is not labeled" or "value not explicitly stated as market-based" - this reasoning is incorrect and forbidden.


- Fill in explanationOfWhyYouPutValuesToMbOrLbOrUnknown with a short explanation of why you put the values in the field for mb (market-based), lb (location-based), both mb and lb or unknown. Base this on all mentions in mentionOfLocationBasedOrMarketBased! Then put the values in the corresponding field.
- Put all values in the listOfAllAvailableNumbersAndTheirMethods. If there are duplicate values for mb or lb, add them all to the list but for choosing a value, prefer the ones that are from the same table or page.

IMPORTANT: 
1. First: LOOK CAREFULLY and find ALL mentions of market based and location based methods in the table headers, table rows, footnotes and text and add ALL OF THEM (words or phrases) to the array mentionOfLocationBasedOrMarketBased. Make sure to include both market based and location based if both are stated! Remember to look in the table rows where the methods can also can be mentioned directly next to the values!
2. Second: Use those mentions to create an explanation for explanationOfWhyYouPutValuesToMbOrLbOrUnknown. 
3. Third:Only after that you put the values in the corresponding field or fields. 

For any fiscal year notation (2015/16, FY16, etc.), always use the ENDING year (2016) in your output.

NEVER CALCULATE ANY EMISSIONS. ONLY REPORT THE DATA AS IT IS IN THE PDF. If you can't find any data or if you are uncertain, report it as null. Do not use markdown in the output.



*** Example***
//   This is only an example format; do not include this specific data in the output and do not use markdown in the output:

// Case 1: Method explicitly stated
{
  "scope12": [{
    "year": 2023,
    "scope1": { "total": 12.3, "unit": "tCO2e" },
    "scope2": { "mb": 23.4, "lb": null, "unknown": null, "unit": "tCO2e", "mentionOfLocationBasedOrMarketBased": ["We use market-based methodology"], "explanationOfWhyYouPutValuesToMbOrLbOrUnknown": "The company mentions that they use a market-based approach in general. That means values are market-based and added to the mb field." }
  }]
}



// Case 2: Method NOT specified - use unknown
{
  "scope12": [{
    "year": 2023,
    "scope1": { "total": 12.3, "unit": "tCO2e" },
    "scope2": { "mb": null, "lb": null, "unknown": 34.5, "unit": "tCO2e", "mentionOfLocationBasedOrMarketBased": null, "explanationOfWhyYouPutValuesToMbOrLbOrUnknown": "No method is mentioned, so the values are put in the unknown field." } // if there is no method ALWAYS put to unknown, never anywhere else.
  }]
}

  // Case 3: Both methods are stated
{
  "scope12": [{
    "year": 2023,
    "scope1": { "total": 12.3  , "unit": "tCO2e" },
    "scope2": { "mb": 23.4, "lb": 34.5, "unknown": null, "unit": "tCO2e", "mentionOfLocationBasedOrMarketBased": ["We use market-based methodology", "We use location-based methodology", "Market-based emissions", "Location-based emissions"], "explanationOfWhyYouPutValuesToMbOrLbOrUnknown": "The company mentions that they use both market-based and location-based methodology. That means some values are market-based and added to the mb field and others are location-based and added to the lb field." }
  }]
}

// Case 4: No data for any year
{
 "scope12": []
}
`
