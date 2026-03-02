import { z } from 'zod'
import { emissionUnitSchemaGarbo } from '@/api/schemas'

export const oldSchema = z.object({
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
              individualValuesForMb: z.union([z.array(z.number()), z.null()]),
              individualValuesForLb: z.union([z.array(z.number()), z.null()]),
              individualValuesForUnknown: z.union([
                z.array(z.number()),
                z.null(),
              ]),
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
    })
  ),
})

export const schema = z.object({
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
              listOfAllAvailableScope2NumbersAndTheirMethods: z.union([
                z.array(
                  z.object({
                    number: z.number(),
                    method: z.string(),
                    specifiedScope: z.array(z.enum(['scope1', 'scope2'])),
                    unit: z.string(),
                    comment: z.string(),
                  })
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
    })
  ),
})

export const schemaScope1And2 = z.object({
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
      scope1And2: z
        .union([
          z
            .object({
              total: z.number(),
              unit: emissionUnitSchemaGarbo,
            })
            .describe(
              'The combined scope 1 and 2 emissions, if other fields are not available'
            ),
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
              listOfAllAvailableScope2NumbersAndTheirMethods: z.union([
                z.array(
                  z.object({
                    number: z.union([z.number(), z.null()]),
                    method: z.enum([
                      'marketBased',
                      'locationBased',
                      'heating/electricityOnly',
                      'electricity/heatingOnly',
                      'unknown',
                    ]),
                    specifiedScope: z.array(z.enum(['scope1', 'scope2'])),
                    unit: z.string(),
                    completeness: z.object({
                      fullScope2: z.boolean(),
                      onlyElectricity: z.boolean(),
                      onlyHeating: z.boolean(),
                      nameOfRow: z.string(),
                    }),
                    comment: z.string(),
                  })
                ),
                z.null(),
              ]),
              listOfMaxThreeSummarizedElectricityAndHeatingValuesToGetFullScope2Values:
                z
                  .union([
                    z.array(
                      z.object({
                        totalValue: z.number(),
                        method: z.string(),
                        unit: z.string(),
                        comment: z.string(),
                      })
                    ),
                    z.null(),
                  ])
                  .nullable()
                  .optional()
                  .describe(
                    'Max three summarized electricity and heating values to get full scope 2 values'
                  ),
              explanationOfWhyYouPutValuesToMbOrLbOrUnknown: z
                .string()
                .nullable()
                .optional(),
              mbValuesWeNeedToSummarize: z
                .union([z.array(z.number()), z.null()])
                .nullable()
                .optional(),
              lbValuesWeNeedToSummarize: z
                .union([z.array(z.number()), z.null()])
                .nullable()
                .optional(),
              unknownScope2ValuesWeNeedToSummarize: z
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
    })
  ),
})
