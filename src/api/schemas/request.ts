import { z } from 'zod'
import {
  emissionUnitSchemaWithDefault,
  emissionUnitSchemaGarbo,
  wikidataIdSchema,
} from './common'

const createMetadataSchema = z.object({
  metadata: z
    .object({
      source: z.string().optional(),
      comment: z.string().optional(),
    })
    .optional(),
  verified: z.boolean().optional(),
})

export const descriptionSchema = z.object({
  id: z.string().optional(),
  language: z.enum(['SV', 'EN']),
  text: z.string(),
})

export const postCompanyBodySchema = z
  .object({
    wikidataId: wikidataIdSchema,
    name: z.string(),
    descriptions: z.array(descriptionSchema).optional(),
    url: z.string().url().optional(),
    logoUrl: z.string().url().optional().nullable(),
    internalComment: z.string().optional(),
    tags: z.array(z.string()).optional(),
    lei: z.string().optional(),
  })
  .merge(createMetadataSchema)

export const reportingPeriodBodySchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reportURL: z.string().optional(),
  })
  .refine(({ startDate, endDate }) => startDate.getTime() < endDate.getTime(), {
    message: 'startDate must be earlier than endDate',
  })

export const goalSchema = z.object({
  description: z.string(),
  year: z.string().optional(),
  target: z.number().optional(),
  baseYear: z.string().optional(),
})

export const postGoalSchema = z
  .object({
    goal: goalSchema,
  })
  .merge(createMetadataSchema)

export const postGoalsSchema = z
  .object({
    goals: z.array(goalSchema),
  })
  .merge(createMetadataSchema)

export const initiativeSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  year: z.string().optional(),
  scope: z.string().optional(),
})

export const postInitiativeSchema = z
  .object({ initiative: initiativeSchema })
  .merge(createMetadataSchema)

export const postInitiativesSchema = z
  .object({
    initiatives: z.array(initiativeSchema),
  })
  .merge(createMetadataSchema)

export const industrySchema = z.object({
  subIndustryCode: z.string(),
})

export const postIndustrySchema = z
  .object({ industry: industrySchema })
  .merge(createMetadataSchema)

export const statedTotalEmissionsSchema = z
  .object({
    total: z.number().nullable().optional(),
    unit: emissionUnitSchemaWithDefault,
    verified: z.boolean().optional(),
  })
  .nullish()

export const emissionsSchema = z
  .object({
    scope1: z
      .object({
        total: z.number().nullable().optional(),
        unit: emissionUnitSchemaWithDefault,
        verified: z.boolean().optional(),
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
        unit: emissionUnitSchemaGarbo.optional(),
        verified: z.boolean().optional(),
      })
      .refine(
        ({ mb, lb, unknown, verified }) =>
          mb !== undefined ||
          lb !== undefined ||
          unknown !== undefined ||
          verified !== undefined,
        {
          message:
            'At least one property of `mb`, `lb` and `unknown` must be defined if scope2 is provided',
        },
      )
      .refine(
        ({ mb, lb, unknown, unit }) => {
          // If all values are null or undefined, unit can be null
          const allValuesNull = 
            (mb === null || mb === undefined) &&
            (lb === null || lb === undefined) &&
            (unknown === null || unknown === undefined);
          
          if (allValuesNull) {
            return true; // unit can be null when all values are null
          }
          
          // If any value is not null, unit must be provided (not null)
          return unit !== null && unit !== undefined;
        },
        {
          message:
            'Unit must be provided when any emission value (mb, lb, or unknown) is not null',
          path: ['unit'],
        },
      )
      .optional()
      .nullable(),
    scope3: z
      .object({
        categories: z
          .array(
            z.object({
              category: z.number().int().min(1).max(16),
              total: z.number().nullable().optional(),
              unit: emissionUnitSchemaGarbo,
              verified: z.boolean().optional(),
            }),
          )
          .optional(),
        statedTotalEmissions: statedTotalEmissionsSchema,
      })
      .nullable()
      .optional(),
    biogenic: z
      .object({
        total: z.number().nullable().optional(),
        unit: emissionUnitSchemaWithDefault,
        verified: z.boolean().optional(),
      })
      .nullable()
      .optional(),
    statedTotalEmissions: statedTotalEmissionsSchema,
    scope1And2: z
      .object({
        total: z.number().nullable().optional(),
        unit: emissionUnitSchemaWithDefault,
        verified: z.boolean().optional(),
      })
      .nullable()
      .optional(),
  })
  .optional()

export const economySchema = z
  .object({
    turnover: z
      .object({
        value: z.number().optional(),
        currency: z.string().optional(),
        verified: z.boolean().optional(),
      })
      .optional(),
    employees: z
      .object({
        value: z.number().optional(),
        unit: z.string().optional(),
        verified: z.boolean().optional(),
      })
      .optional(),
  })
  .optional()

export const postEconomySchema = z.object({
  economy: economySchema,
})

export const baseYear = z.object({
  baseYear: z.number().optional(),
})

export const postBaseYear = z
  .object({
    baseYear: z.number(),
  })
  .merge(createMetadataSchema)

export const postEmissionsSchema = z.object({
  emissions: emissionsSchema,
})

export const reportingPeriodSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reportURL: z.string().optional(),
    emissions: emissionsSchema,
    economy: economySchema,
  })
  .refine(({ startDate, endDate }) => startDate.getTime() < endDate.getTime(), {
    message: 'startDate must be earlier than endDate',
  })

export const postReportingPeriodsSchema = z
  .object({
    reportingPeriods: z.array(reportingPeriodSchema),
    replaceAllEmissions: z.boolean().optional(),
  })
  .merge(createMetadataSchema)

export const MunicipalityNameSchema = z.string()

export const MunicipalityNameParamSchema = z.object({
  name: MunicipalityNameSchema,
})

export const RegionalNameSchema = z.string()

export const RegionalNameParamSchema = z.object({
  name: RegionalNameSchema,
})

export const userAuthenticationBodySchema = z.object({
  code: z.string(),
})

export const postWikidataBodySchema = z.object({
  wikidataId: wikidataIdSchema,
})

export const serviceAuthenticationBodySchema = z.object({
  client_id: z.string(),
  client_secret: z.string(),
})

export const exportQuerySchema = z.object({
  type: z.enum(['csv', 'json', 'xlsx']).optional(),
  year: z.string().optional(),
})

export const claimValidationSchema = z.object({
  steal: z.boolean(),
})
