import { z } from 'zod'

export const wikidataIdSchema = z.string().regex(/Q\d+/)

export const wikidataIdParamSchema = z.object({ wikidataId: wikidataIdSchema })

export const garboEntitySchema = z.object({ id: z.coerce.number() })

/**
 * This allows reporting periods like 2022-2023
 */
export const yearSchema = z.string().regex(/\d{4}(?:-\d{4})?/)

export const yearParamSchema = z.object({ year: yearSchema })

const createMetadataSchema = z.object({
  metadata: z
    .object({
      source: z.string().optional(),
      comment: z.string().optional(),
    })
    .optional(),
})

export const upsertCompanyBodySchema = z.object({
  wikidataId: wikidataIdSchema,
  name: z.string(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  internalComment: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export const postCompanyBodySchema = z.object({
  company: upsertCompanyBodySchema,
})

export const metadataRequestBody = z
  .object({
    metadata: z
      .object({
        comment: z.string().optional(),
        source: z.string().optional(),
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
  .object({ total: z.number() })
  .optional()

export const emissionsSchema = z
  .object({
    scope1: z
      .object({
        total: z.number(),
      })
      .optional(),
    scope2: z
      .object({
        mb: z
          .number({ description: 'Market-based scope 2 emissions' })
          .optional(),
        lb: z
          .number({ description: 'Location-based scope 2 emissions' })
          .optional(),
        unknown: z
          .number({ description: 'Unspecified Scope 2 emissions' })
          .optional(),
      })
      .refine(
        ({ mb, lb, unknown }) =>
          mb !== undefined || lb !== undefined || unknown !== undefined,
        {
          message:
            'At least one property of `mb`, `lb` and `unknown` must be defined if scope2 is provided',
        }
      )
      .optional(),
    scope3: z
      .object({
        categories: z
          .array(
            z.object({
              category: z.number().int().min(1).max(16),
              total: z.number(),
            })
          )
          .optional(),
        statedTotalEmissions: statedTotalEmissionsSchema,
      })
      .optional(),
    biogenic: z.object({ total: z.number() }).optional(),
    statedTotalEmissions: statedTotalEmissionsSchema,
    scope1And2: z.object({ total: z.number() }).optional(),
  })
  .optional()

export const economySchema = z
  .object({
    turnover: z
      .object({
        value: z.number().optional(),
        currency: z.string().optional(),
      })
      .optional(),
    employees: z
      .object({
        value: z.number().optional(),
        unit: z.string().optional(),
      })
      .optional(),
  })
  .optional()

export const postEconomySchema = z.object({
  economy: economySchema,
})

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
  })
  .merge(createMetadataSchema)

export const errorMessageSchema = z.object({ message: z.string() })

/**
 * Get common error responses for a list of HTTP status codes.
 */
export function getErrorResponseSchemas(...statusCodes: number[]) {
  return statusCodes.reduce((acc, status) => {
    acc[status] = errorMessageSchema
    return acc
  }, {} as Record<number, z.ZodType>)
}

export const okResponseSchema = z.object({ ok: z.boolean() })
