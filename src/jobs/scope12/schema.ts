import { z } from "zod"
import { emissionUnitSchemaGarbo } from "@/api/schemas"

export const oldSchema = z.object({
  scope12: z.array(
    z.object({
      year: z.number(),
      scope1: z.union([
        z.object({
          total: z.number(),
          unit: emissionUnitSchemaGarbo,
        }),
        z.null()
      ]).optional(),
      scope2: z.union([
        z.object({
          mentionOfLocationBasedOrMarketBased: z.union([
            z.array(z.string()),
            z.null()
          ]).optional(),
          explanationOfWhyYouPutValuesToMbOrLbOrUnknown: z.string().nullable().optional(),
          individualValuesForMb: z.union([z.array(z.number()), z.null()]),
          individualValuesForLb: z.union([z.array(z.number()), z.null()]),
          individualValuesForUnknown: z.union([z.array(z.number()), z.null()]),
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
    })
  ),
})

export const schema = z.object({
  scope12: z.array(
    z.object({
      absoluteMostRecentYearInReport: z.number(),
      year: z.number(),
      scope1: z.union([
        z.object({
          total: z.number(),
          unit: emissionUnitSchemaGarbo,
        }),
        z.null()
      ]).optional(),
      scope2: z.union([
        z.object({
          mentionOfLocationBasedOrMarketBased: z.union([
            z.array(z.string()),
            z.null()
          ]).optional(),
          listOfAllAvailableScope2NumbersAndTheirMethods: z.union([z.array(z.object({
            number: z.number(),
            method: z.string(),
            specifiedScope: z.array(z.enum(['scope1', 'scope2'])),
            unit: z.string(),
            comment: z.string(),
          })), z.null()]),
          explanationOfWhyYouPutValuesToMbOrLbOrUnknown: z.string().nullable().optional(),
          mbValuesWeNeedToSum: z.union([z.array(z.number()), z.null()]).nullable().optional(),
          lbValuesWeNeedToSum: z.union([z.array(z.number()), z.null()]).nullable().optional(),
          unknownValuesWeNeedToSum: z.union([z.array(z.number()), z.null()]).nullable().optional(),
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
    })
  ),
})
  