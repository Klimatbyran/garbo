import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

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
export const emptyBodySchema = z.undefined()

export const MetadataSchema = z.object({
  comment: z
    .string()
    .nullable()
    .openapi({ description: 'Comment about the data' }),
  source: z.string().nullable().openapi({ description: 'Source of the data' }),
  updatedAt: z.date().openapi({ description: 'Last update timestamp' }),
  user: z.object({
    name: z
      .string()
      .openapi({ description: 'Name of the user who updated the data' }),
  }),
  verifiedBy: z
    .object({
      name: z
        .string()
        .openapi({ description: 'Name of the user who verified the data' }),
    })
    .nullable(),
})

export const MinimalMetadataSchema = MetadataSchema.pick({ verifiedBy: true })

export const ErrorSchema = z.object({
  error: z.string().openapi({ description: 'Error message' }),
  details: z
    .any()
    .nullable()
    .openapi({ description: 'Additional error details' }),
})

const CompanyBaseSchema = z.object({
  wikidataId: wikidataIdSchema,
  name: z.string(),
  description: z
    .string()
    .nullable()
    .openapi({ description: 'Company description' }),
})

export const StatedTotalEmissionsSchema = z.object({
  total: z.number().openapi({ description: 'Total emissions value' }),
  unit: z.string().openapi({ description: 'Unit of measurement' }),
  metadata: MetadataSchema,
})

export const BiogenicSchema = z.object({
  total: z.number().openapi({ description: 'Total biogenic emissions' }),
  unit: z.string().openapi({ description: 'Unit of measurement' }),
  metadata: MetadataSchema,
})

export const Scope1Schema = z.object({
  total: z.number().openapi({ description: 'Total scope 1 emissions' }),
  unit: z.string().openapi({ description: 'Unit of measurement' }),
  metadata: MetadataSchema,
})

export const Scope2BaseSchema = z.object({
  mb: z
    .number()
    .nullable()
    .openapi({ description: 'Market-based scope 2 emissions' }),
  lb: z
    .number()
    .nullable()
    .openapi({ description: 'Location-based scope 2 emissions' }),
  unknown: z
    .number()
    .nullable()
    .openapi({ description: 'Unspecified scope 2 emissions' }),
  unit: z.string().openapi({ description: 'Unit of measurement' }),
  metadata: MetadataSchema,
  calculatedTotalEmissions: z
    .number()
    .openapi({ description: 'Calculated total scope 2 emissions' }),
})

const withScope2Refinement = <T extends z.ZodRawShape>(
  schema: z.ZodObject<T>
) =>
  schema.refine(
    ({ mb, lb, unknown }) =>
      mb !== undefined || lb !== undefined || unknown !== undefined,
    {
      message:
        'At least one property of `mb`, `lb` and `unknown` must be defined if scope2 is provided',
    }
  )

export const Scope2Schema = withScope2Refinement(Scope2BaseSchema)

export const Scope3CategorySchema = z.object({
  category: z
    .number()
    .int()
    .min(1)
    .max(16)
    .openapi({ description: 'Scope 3 category number (1-16)' }),
  total: z
    .number()
    .openapi({ description: 'Total emissions for this category' }),
  unit: z.string().openapi({ description: 'Unit of measurement' }),
  metadata: MetadataSchema,
})

export const Scope3Schema = z.object({
  categories: z.array(Scope3CategorySchema),
  statedTotalEmissions: StatedTotalEmissionsSchema.nullable(),
  calculatedTotalEmissions: z
    .number()
    .openapi({ description: 'Calculated total scope 3 emissions' }),
  metadata: MetadataSchema,
})

export const EmissionsSchema = z.object({
  scope1: Scope1Schema.nullable(),
  scope2: Scope2Schema.nullable(),
  scope3: Scope3Schema.nullable(),
  // TODO: Add scope1And2 to match actual response
  // TODO: Add minimal scope1And2 schema for list view
  biogenicEmissions: BiogenicSchema.nullable(),
  statedTotalEmissions: StatedTotalEmissionsSchema.nullable(),
  calculatedTotalEmissions: z
    .number()
    .openapi({ description: 'Total calculated emissions across all scopes' }),
})

export const TurnoverSchema = z.object({
  value: z.number().nullable().openapi({ description: 'Turnover value' }),
  currency: z.string().nullable().openapi({ description: 'Currency code' }),
  metadata: MetadataSchema,
})

export const EmployeesSchema = z.object({
  value: z.number().nullable().openapi({ description: 'Number of employees' }),
  unit: z.string().nullable().openapi({ description: 'Unit of measurement' }),
  metadata: MetadataSchema,
})

export const EconomySchema = z.object({
  turnover: TurnoverSchema.nullable(),
  employees: EmployeesSchema.nullable(),
})

export const IndustryGicsSchema = z.object({
  sectorCode: z.string().openapi({ description: 'GICS sector code' }),
  groupCode: z.string().openapi({ description: 'GICS group code' }),
  industryCode: z.string().openapi({ description: 'GICS industry code' }),
  subIndustryCode: z
    .string()
    .openapi({ description: 'GICS sub-industry code' }),
  sv: z.object({
    sectorName: z.string(),
    groupName: z.string(),
    industryName: z.string(),
    subIndustryName: z.string(),
    subIndustryDescription: z.string(),
  }),
  en: z.object({
    sectorName: z.string(),
    groupName: z.string(),
    industryName: z.string(),
    subIndustryName: z.string(),
    subIndustryDescription: z.string(),
  }),
})

export const MinimalIndustryGicsSchema = IndustryGicsSchema.omit({
  sv: true,
  en: true,
})

export const IndustrySchema = z.object({
  industryGics: IndustryGicsSchema,
  metadata: MetadataSchema,
})

export const MinimalIndustrySchema = z.object({
  industryGics: MinimalIndustryGicsSchema,
  metadata: MinimalMetadataSchema,
})

export const GoalSchema = z.object({
  description: z.string().openapi({ description: 'Goal description' }),
  year: z.string().nullable().openapi({ description: 'Target year' }),
  baseYear: z.string().nullable().openapi({ description: 'Base year' }),
  target: z.number().nullable().openapi({ description: 'Target value' }),
  metadata: MetadataSchema,
})

export const InitiativeSchema = z.object({
  title: z.string().openapi({ description: 'Initiative title' }),
  description: z
    .string()
    .nullable()
    .openapi({ description: 'Initiative description' }),
  year: z.string().nullable().openapi({ description: 'Initiative year' }),
  scope: z.string().nullable().openapi({ description: 'Affected scopes' }),
  metadata: MetadataSchema,
})

export const ReportingPeriodSchema = z.object({
  startDate: z
    .date()
    .openapi({ description: 'Start date of reporting period' }),
  endDate: z.date().openapi({ description: 'End date of reporting period' }),
  reportURL: z
    .string()
    .nullable()
    .openapi({ description: 'URL to the report' }),
  emissions: EmissionsSchema.nullable(),
  economy: EconomySchema.nullable(),
})

const MinimalTurnoverSchema = TurnoverSchema.omit({ metadata: true }).extend({
  metadata: MinimalMetadataSchema,
})

const MinimalEmployeeSchema = EmployeesSchema.omit({ metadata: true }).extend({
  metadata: MinimalMetadataSchema,
})

const MinimalEconomySchema = EconomySchema.omit({
  employees: true,
  turnover: true,
}).extend({
  employees: MinimalEmployeeSchema.nullable(),
  turnover: MinimalTurnoverSchema.nullable(),
})

const MinimalScope1Schema = Scope1Schema.omit({
  metadata: true,
}).extend({ metadata: MinimalMetadataSchema })

const MinimalScope2Schema = withScope2Refinement(
  Scope2BaseSchema.omit({
    metadata: true,
  }).extend({ metadata: MinimalMetadataSchema })
)

const MinimalStatedTotalEmissionsSchema = StatedTotalEmissionsSchema.omit({
  metadata: true,
}).extend({ metadata: MinimalMetadataSchema })

const MinimalScope3CategorySchema = Scope3CategorySchema.omit({
  metadata: true,
}).extend({ metadata: MinimalMetadataSchema })

const MinimalScope3Schema = Scope3Schema.omit({
  metadata: true,
  categories: true,
  statedTotalEmissions: true,
}).extend({
  metadata: MinimalMetadataSchema,
  statedTotalEmissions: MinimalStatedTotalEmissionsSchema,
  categories: z.array(MinimalScope3CategorySchema),
})

const MinimalEmissionsSchema = EmissionsSchema.omit({
  biogenicEmissions: true,
  scope1: true,
  scope2: true,
  scope3: true,
  statedTotalEmissions: true,
}).extend({
  scope1: MinimalScope1Schema,
  scope2: MinimalScope2Schema,
  scope3: MinimalScope3Schema,
  statedTotalEmissions: MinimalStatedTotalEmissionsSchema,
})

const MinimalReportingPeriodSchema = ReportingPeriodSchema.omit({
  emissions: true,
  economy: true,
}).extend({
  emissions: MinimalEmissionsSchema.nullable(),
  economy: MinimalEconomySchema.nullable(),
})

const MinimalCompanyBase = CompanyBaseSchema.extend({
  reportingPeriods: z.array(MinimalReportingPeriodSchema),
  industry: MinimalIndustrySchema.nullable(),
})

const CompanyBase = CompanyBaseSchema.extend({
  reportingPeriods: z.array(ReportingPeriodSchema),
  industry: IndustrySchema.nullable(),
})

export const CompanyList = z.array(MinimalCompanyBase)

export const CompanyDetails = CompanyBase.extend({
  goals: z.array(GoalSchema).nullable(),
  initiatives: z.array(InitiativeSchema).nullable(),
})
