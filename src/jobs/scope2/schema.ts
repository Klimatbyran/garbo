import { z } from "zod"
import { emissionUnitSchemaGarbo } from "@/api/schemas"


export const schema = z.object({
  scope2: z.array(
    z.object({
      absoluteMostRecentYearInReport: z.number(),
      year: z.number(),
      listOfAllScope2NumbersForThisYearAndTheirMethods: z.union([z.array(z.object({
        numberIsNullOrNoValue: z.boolean(),
        yearHeader: z.string(),
        year: z.number(),
        yearMatchesThisObjectYear: z.boolean(),
        comment: z.string(),
        method: z.array(z.enum(['scope2 sum', 'marketBased', 'locationBased', 'heating', 'electricity', 'cooling', 'unknown', 'combined 1+2'])).nullable().optional(),
        specifiedScope: z.array(z.enum(['scope1+2 combined', 'scope2'])),
        exactQuoteOfNumberInTheDocumentBeforeAnyConversion: z.string(),
        number: z.union([z.number(), z.null()]),
        unit: z.string(),
        completeness: z.object({
          fullScope2: z.boolean(),
          onlyElectricity: z.boolean(),
          onlyHeating: z.boolean(),
          onlyCooling: z.boolean(),
          nameOfRow: z.string(),
        }),
        valueIsFullScope2AndCanBeUsedAsFinalValue: z.boolean(),
        titleOfTableOrSectionJustAboveThisNumber: z.string(),
        absoluteValueOrPerSomething: z.enum(['absolute', 'perSomething']),
        appliesTowholeCompanyOrJustPartOfCompany: z.enum(['wholeCompany','partOfCompany']),
      })), z.null()]),
      scope2: z.union([
        z.object({
          mentionOfLocationBasedOrMarketBased: z.union([
            z.array(z.string()),
            z.null()
          ]).optional(),
          listOfMaxThreeSummarizedElectricityAndHeatingValuesToGetFullScope2Values: z.union([z.array(z.object({
            totalValue: z.number(),
            method: z.string(),
            unit: z.string(),
            comment: z.string(),
          })), z.null()]).nullable().optional().describe('Max three summarized electricity and heating values to get full scope 2 values'),
          explanationOfWhyYouPutValuesToMbOrLbOrUnknown: z.string().nullable().optional(),
          fullScope2mbValuesWeNeedToSummarize: z.union([z.array(z.number()), z.null()]).nullable().optional(),
          fullScope2lbValuesWeNeedToSummarize: z.union([z.array(z.number()), z.null()]).nullable().optional(),
          fullUnknownScope2ValuesWeNeedToSummarize: z.union([z.array(z.number()), z.null()]).nullable().optional(),
          mb: z.union([
            z.number({ description: 'Market-based scope 2 emissions' }),
            z.null()
          ]).optional(),
          lb: z.union([
            z.number({ description: 'Location-based scope 2 emissions' }),
            z.null()
          ]).optional(),
          unknown: z.union([
            z.number({ description: 'Unspecified Scope 2 emissions' }),
            z.null()
          ]).optional(),
          unit: emissionUnitSchemaGarbo,

          }).refine(({ mb, lb, unknown }) => mb || lb || unknown, {
          message:
            'At least one property of `mb`, `lb` and `unknown` must be defined if scope2 is provided',
        }),
        z.null()
      ]).optional(),
      scope1And2: z.union([
        z.object({
          total: z.number(),
          unit: emissionUnitSchemaGarbo,
        }),
        z.null()
      ]).optional(),
    })
  ),
})

