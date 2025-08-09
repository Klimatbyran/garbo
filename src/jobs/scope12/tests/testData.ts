import { emissionUnitSchemaGarbo } from "@/api/schemas"
import z from "zod"

export const correctResult = {
    "scope12": [
      {
        "year": 2024,
        "scope1": {
          "total": 61657,
          "unit": "tCO2"
        },
        "scope2": {
          "mb": 7828,
          "lb": null,
          "unknown": null,
          "unit": "tCO2"
        }
      },
      {
        "year": 2023,
        "scope1": {
          "total": 54361,
          "unit": "tCO2"
        },
        "scope2": {
          "mb": 19431,
          "lb": null,
          "unknown": null,
          "unit": "tCO2"
        }
      },
      {
        "year": 2022,
        "scope1": {
          "total": 58543,
          "unit": "tCO2"
        },
        "scope2": {
          "mb": 35618,
          "lb": null,
          "unknown": null,
          "unit": "tCO2"
        }
      }
    ]
  }


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
    })
  ),
})

export const newSchema = z.object({
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



export const newSchemaWithInstructions = z.object({
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
            z.string(),
            z.null()
          ]).optional(),
          explanationOfWhyYouPutValuesToMbOrLbOrUnknown: z.string().nullable().optional(),
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

