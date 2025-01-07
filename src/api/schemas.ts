import { z } from 'zod'

export const wikidataIdSchema = z.string().regex(/Q\d+/)

export const wikidataIdParamSchema = z.object({ wikidataId: wikidataIdSchema })

export const upsertCompanyBodySchema = z.object({
  wikidataId: wikidataIdSchema,
  name: z.string(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  internalComment: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export const metadataRequestBody = z
  .object({
    metadata: z
      .object({
        comment: z.string().optional(),
        source: z.string().optional(),
        dataOrigin: z.string().optional(),
      })
      .optional(),
  })
  .optional()

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

export const goalsSchema = z.object({
  goals: z.array(goalSchema),
})

export const initiativeSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  year: z.string().optional(),
  scope: z.string().optional(),
})

export const industrySchema = z.object({
  industry: z.object({
    subIndustryCode: z.string(),
  }),
})

export const statedTotalEmissionsSchema = z
  .object({ total: z.number() })
  .optional()
  .nullable()
  .describe('Sending null means deleting the statedTotalEmissions')

export const emissionsSchema = z
  .object({
    scope1: z
      .object({
        total: z.number(),
      })
      .optional()
      .nullable()
      .describe('Sending null means deleting the scope'),
    scope2: z
      .object({
        mb: z
          .number({ description: 'Market-based scope 2 emissions' })
          .optional()
          .nullable()
          .describe('Sending null means deleting mb scope 2 emissions'),
        lb: z
          .number({ description: 'Location-based scope 2 emissions' })
          .optional()
          .nullable()
          .describe('Sending null means deleting lb scope 2 emissions'),
        unknown: z
          .number({ description: 'Unspecified Scope 2 emissions' })
          .optional()
          .nullable()
          .describe('Sending null means deleting unknown scope 2 emissions'),
      })
      .refine(
        ({ mb, lb, unknown }) =>
          mb !== undefined || lb !== undefined || unknown !== undefined,
        {
          message:
            'At least one property of `mb`, `lb` and `unknown` must be defined if scope2 is provided',
        }
      )
      .optional()
      .nullable()
      .describe('Sending null means deleting the scope'),
    scope3: z
      .object({
        categories: z
          .array(
            z.object({
              category: z.number().int().min(1).max(16),
              total: z.number().nullable(),
            })
          )
          .optional(),
        statedTotalEmissions: statedTotalEmissionsSchema,
      })
      .optional(),
    biogenic: z
      .object({ total: z.number() })
      .optional()
      .nullable()
      .describe('Sending null means deleting the biogenic'),
    statedTotalEmissions: statedTotalEmissionsSchema,
    scope1And2: z
      .object({ total: z.number() })
      .optional()
      .nullable()
      .describe('Sending null means deleting the scope'),
  })
  .optional()

export const economySchema = z
  .object({
    turnover: z
      .object({
        value: z.number().optional(),
        currency: z.string().optional(),
      })
      .optional()
      .nullable()
      .describe('Sending null means deleting the turnover'),
    employees: z
      .object({
        value: z.number().optional(),
        unit: z.string().optional(),
      })
      .optional()
      .nullable()
      .describe('Sending null means deleting the employees data'),
  })
  .optional()

export const postEconomyBodySchema = z.object({
  economy: economySchema,
})

export const postEmissionsBodySchema = z.object({
  emissions: emissionsSchema,
})

export const postReportingPeriodsSchema = z.object({
  reportingPeriods: z.array(
    z
      .object({
        startDate: z.coerce.date(),
        endDate: z.coerce.date(),
        reportURL: z.string().optional(),
        emissions: emissionsSchema,
        economy: economySchema,
      })
      .refine(
        ({ startDate, endDate }) => startDate.getTime() < endDate.getTime(),
        {
          message: 'startDate must be earlier than endDate',
        }
      )
  ),
})
