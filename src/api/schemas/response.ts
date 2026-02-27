import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { emissionUnitSchemaGarbo, wikidataIdSchema } from './common'

extendZodWithOpenApi(z)

const dateStringSchema = z.union([
  z.date(),
  z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date string',
  }),
])

export const okResponseSchema = z.object({ ok: z.boolean() })
export const redirectResponseSchema = z.object({ location: z.string() })
export const emptyBodySchema = z.undefined()

export const MetadataSchema = z.object({
  id: z.string(),
  comment: z
    .string()
    .nullable()
    .openapi({ description: 'Comment about the data' }),
  source: z.string().nullable().openapi({ description: 'Source of the data' }),
  updatedAt: dateStringSchema.openapi({ description: 'Last update timestamp' }),
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

const CompanyBaseSchema = z.object({
  wikidataId: wikidataIdSchema,
  name: z.string(),
  lei: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
})

export const StatedTotalEmissionsSchema = z.object({
  id: z.string(),
  total: z
    .number()
    .nullable()
    .openapi({ description: 'Total emissions value' }),
  unit: z.string().openapi({ description: 'Unit of measurement' }),
  metadata: MetadataSchema,
})

export const ResponseDescriptionSchema = z.object({
  id: z.string(),
  language: z.enum(['SV', 'EN']),
  text: z.string(),
})

export const BiogenicSchema = z.object({
  id: z.string(),
  total: z
    .number()
    .nullable()
    .openapi({ description: 'Total biogenic emissions' }),
  unit: z.string().openapi({ description: 'Unit of measurement' }),
  metadata: MetadataSchema,
})

export const Scope1Schema = z.object({
  id: z.string(),
  total: z
    .number()
    .nullable()
    .openapi({ description: 'Total scope 1 emissions' }),
  unit: z.string().openapi({ description: 'Unit of measurement' }),
  metadata: MetadataSchema,
})

export const Scope2BaseSchema = z.object({
  id: z.string(),
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
    .nullable()
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
  id: z.string(),
  category: z
    .number()
    .int()
    .min(1)
    .max(16)
    .openapi({ description: 'Scope 3 category number (1-16)' }),
  total: z
    .number()
    .nullable()
    .openapi({ description: 'Total emissions for this category' }),
  unit: emissionUnitSchemaGarbo.openapi({ description: 'Unit of measurement' }),
  metadata: MetadataSchema,
})

export const Scope3Schema = z.object({
  id: z.string(),
  categories: z.array(Scope3CategorySchema),
  statedTotalEmissions: StatedTotalEmissionsSchema.nullable().optional(),
  calculatedTotalEmissions: z
    .number()
    .nullable()
    .openapi({ description: 'Calculated total scope 3 emissions' }),
  metadata: MetadataSchema,
})

export const Scope1And2Schema = z.object({
  id: z.string(),
  total: z.number().nullable(),
  unit: z.string(),
  metadata: MetadataSchema,
})

export const EmissionsSchema = z.object({
  id: z.string(),
  scope1: Scope1Schema.nullable(),
  scope2: Scope2Schema.nullable(),
  scope3: Scope3Schema.nullable(),
  scope1And2: Scope1And2Schema.nullable(),
  biogenicEmissions: BiogenicSchema.nullable(),
  statedTotalEmissions: StatedTotalEmissionsSchema.nullable(),
  calculatedTotalEmissions: z
    .number()
    .nullable()
    .openapi({ description: 'Total calculated emissions across all scopes' }),
})

export const TurnoverSchema = z.object({
  id: z.string(),
  value: z.number().nullable().openapi({ description: 'Turnover value' }),
  currency: z.string().nullable().openapi({ description: 'Currency code' }),
  metadata: MetadataSchema,
})

export const EmployeesSchema = z.object({
  id: z.string(),
  value: z.number().nullable().openapi({ description: 'Number of employees' }),
  unit: z.string().nullable().openapi({ description: 'Unit of measurement' }),
  metadata: MetadataSchema,
})

export const EconomySchema = z.object({
  id: z.string(),
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

export const BaseYearSchema = z.object({
  id: z.string(),
  year: z.number(),
  metadata: MetadataSchema,
})
export const IndustrySchema = z.object({
  id: z.string(),
  industryGics: IndustryGicsSchema,
  metadata: MetadataSchema,
})

export const MinimalIndustrySchema = z.object({
  industryGics: MinimalIndustryGicsSchema,
  metadata: MinimalMetadataSchema,
})

export const GoalSchema = z.object({
  id: z.string(),
  description: z.string().openapi({ description: 'Goal description' }),
  year: z.string().nullable().openapi({ description: 'Target year' }),
  baseYear: z.string().nullable().openapi({ description: 'Base year' }),
  target: z.number().nullable().openapi({ description: 'Target value' }),
  metadata: MetadataSchema,
})

export const InitiativeSchema = z.object({
  id: z.string(),
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
  id: z.string(),
  startDate: dateStringSchema.openapi({
    description: 'Start date of reporting period',
  }),
  endDate: dateStringSchema.openapi({
    description: 'End date of reporting period',
  }),
  reportURL: z
    .string()
    .nullable()
    .openapi({ description: 'URL to the report' }),
  emissions: EmissionsSchema.nullable(),
  economy: EconomySchema.nullable(),
  emissionsChangeLastTwoYears: z
    .object({
      absolute: z.number().nullable(),
      adjusted: z.number().nullable(),
    })
    .optional(),
})

const MinimalTurnoverSchema = TurnoverSchema.omit({
  id: true,
  metadata: true,
}).extend({
  metadata: MinimalMetadataSchema,
})

const MinimalEmployeeSchema = EmployeesSchema.omit({
  id: true,
  metadata: true,
}).extend({
  metadata: MinimalMetadataSchema,
})

const MinimalEconomySchema = EconomySchema.omit({
  id: true,
  employees: true,
  turnover: true,
}).extend({
  employees: MinimalEmployeeSchema.nullable(),
  turnover: MinimalTurnoverSchema.nullable(),
})

const MinimalScope1Schema = Scope1Schema.omit({
  id: true,
  metadata: true,
}).extend({ metadata: MinimalMetadataSchema })

const MinimalScope2Schema = withScope2Refinement(
  Scope2BaseSchema.omit({
    id: true,
    metadata: true,
  }).extend({ metadata: MinimalMetadataSchema })
)

const MinimalStatedTotalEmissionsSchema = StatedTotalEmissionsSchema.omit({
  id: true,
  metadata: true,
}).extend({ metadata: MinimalMetadataSchema })

const MinimalScope3CategorySchema = Scope3CategorySchema.omit({
  id: true,
  metadata: true,
}).extend({ metadata: MinimalMetadataSchema })

const MinimalScope3Schema = Scope3Schema.omit({
  id: true,
  metadata: true,
  categories: true,
  statedTotalEmissions: true,
}).extend({
  metadata: MinimalMetadataSchema,
  statedTotalEmissions: MinimalStatedTotalEmissionsSchema.nullable(),
  categories: z.array(MinimalScope3CategorySchema),
})

const MinimalScope1And2Schema = Scope1And2Schema.omit({
  id: true,
  metadata: true,
}).extend({ metadata: MinimalMetadataSchema })

const MinimalEmissionsSchema = EmissionsSchema.omit({
  id: true,
  scope1: true,
  scope2: true,
  scope3: true,
  scope1And2: true,
  biogenicEmissions: true,
  statedTotalEmissions: true,
}).extend({
  scope1: MinimalScope1Schema.nullable(),
  scope2: MinimalScope2Schema.nullable(),
  scope3: MinimalScope3Schema.nullable(),
  scope1And2: MinimalScope1And2Schema.nullable(),
  statedTotalEmissions: MinimalStatedTotalEmissionsSchema.nullable(),
})

export const MinimalReportingPeriodSchema = ReportingPeriodSchema.omit({
  id: true,
  emissions: true,
  economy: true,
}).extend({
  emissions: MinimalEmissionsSchema.nullable(),
  economy: MinimalEconomySchema.nullable(),
})

export const MinimalCompanyBase = CompanyBaseSchema.extend({
  description: z.string().optional().nullable(),
  descriptions: z.array(ResponseDescriptionSchema).optional(),
  reportingPeriods: z.array(MinimalReportingPeriodSchema),
  futureEmissionsTrendSlope: z.number().nullable(),
  industry: MinimalIndustrySchema.nullable(),
  baseYear: BaseYearSchema.nullable().optional(),
  logoUrl: z.string().url().optional().nullable(),
  tags: z.array(z.string()),
})

const CompanyBase = CompanyBaseSchema.extend({
  description: z.string().optional().nullable(),
  descriptions: z.array(ResponseDescriptionSchema).optional(),
  reportingPeriods: z.array(ReportingPeriodSchema),
  futureEmissionsTrendSlope: z.number().nullable(),
  industry: IndustrySchema.nullable(),
  baseYear: BaseYearSchema.nullable().optional(),
  logoUrl: z.string().url().optional().nullable(),
})

export const CompanyList = z.array(MinimalCompanyBase)

export const ReportsReportingPeriodSchema = ReportingPeriodSchema.omit({
  emissions: true,
  economy: true,
})

export const ReportsCompanyList = z.array(
  z.object({
    name: z.string(),
    wikidataId: wikidataIdSchema,
    reportingPeriods: z.array(ReportsReportingPeriodSchema),
  })
)

export const CompanyDetails = CompanyBase.extend({
  goals: z.array(GoalSchema).nullable(),
  initiatives: z.array(InitiativeSchema).nullable(),
})

function transformYearlyData(
  yearlyData: Record<string, number>
): { year: string; value: number }[] {
  return Object.entries(yearlyData).map(([year, value]) => ({
    year,
    value,
  }))
}

const YearlyDataSchema = z
  .object({
    year: z.string(),
    value: z.number(),
  })
  .nullable()

const InputYearlyDataSchema = z
  .record(z.string(), z.number())
  .transform(transformYearlyData)

/**
 * Matching the input file format for municipality data
 */
export const InputMunicipalitySchema = z.object({
  name: z.string(),
  region: z.string(),
  logoUrl: z.string().nullable(),
  emissions: InputYearlyDataSchema,
  totalTrend: z.number(),
  totalCarbonLaw: z.number(),
  approximatedHistoricalEmission: InputYearlyDataSchema,
  trend: InputYearlyDataSchema,
  historicalEmissionChangePercent: z.number(),
  electricCarChangePercent: z.number(),
  climatePlanLink: z.string().nullable(),
  climatePlanYear: z.number().nullable(),
  climatePlanComment: z.string().nullable(),
  bicycleMetrePerCapita: z.number(),
  totalConsumptionEmission: z.number(),
  electricVehiclePerChargePoints: z.number().nullable(),
  procurementScore: z.number(),
  procurementLink: z.string().nullable(),
  politicalRule: z.array(z.string()),
  politicalKSO: z.string(),
})

export const InputMunicipalitiesSchema = z.array(InputMunicipalitySchema)

export const MunicipalitySchema = InputMunicipalitySchema.omit({
  emissions: true,
  approximatedHistoricalEmission: true,
  trend: true,
}).extend({
  emissions: z.array(YearlyDataSchema),
  approximatedHistoricalEmission: z.array(YearlyDataSchema),
  trend: z.array(YearlyDataSchema),
})

export const MunicipalitiesSchema = z.array(MunicipalitySchema)

export const MunicipalitySectorEmissionsSchema = z.object({
  sectors: z.record(z.string(), z.record(z.string(), z.number())),
})

/**
 * Regional data schemas
 */
export const RegionalSectorEmissionsSchema = z.object({
  sectors: z.record(z.string(), z.record(z.string(), z.number())),
})

/**
 * Regional data schemas
 */
export const InputRegionalDataSchema = z.array(
  z
    .object({
      region: z.string(),
      logoUrl: z.string().nullable().optional(),
      emissions: InputYearlyDataSchema,
      total_trend: z.number(),
      emissions_slope: z.number().optional(),
      totalCarbonLaw: z.number(),
      approximatedHistoricalEmission: InputYearlyDataSchema,
      trend: InputYearlyDataSchema,
      historicalEmissionChangePercent: z.number(),
      meetsParis: z.string().transform((val) => val === 'True'),
      municipalities: z.array(z.string()),
    })
    .transform((data) => ({
      ...data,
      totalTrend: data.total_trend,
      total_trend: undefined,
      emissions_slope: undefined,
    }))
)

export const RegionalDataSchema = z.object({
  region: z.string(),
  logoUrl: z.string().nullable().optional(),
  emissions: z.array(YearlyDataSchema),
  totalTrend: z.number(),
  totalCarbonLaw: z.number(),
  approximatedHistoricalEmission: z.array(YearlyDataSchema),
  trend: z.array(YearlyDataSchema),
  historicalEmissionChangePercent: z.number(),
  meetsParis: z.boolean(),
  municipalities: z.array(z.string()),
})

export const RegionalDataListSchema = z.array(RegionalDataSchema)

export const RegionalKpiSchema = z.object({
  region: z.string(),
  meetsParis: z.boolean(),
  historicalEmissionChangePercent: z.number(),
})

export const AuthentificationResponseScheme = z.object({
  token: z.string(),
  client: z.string().optional(),
  redirect_uri: z.string().url().optional(),
})

export const RegionalKpiListSchema = z.array(RegionalKpiSchema)

/**
 * National data schemas
 */
export const NationalSectorEmissionsSchema = z.object({
  sectors: z.record(z.string(), z.record(z.string(), z.number())),
})

export const InputNationalDataSchema = z.array(
  z.object({
    country: z.string(),
    logoUrl: z.string().nullable().optional(),
    emissions: InputYearlyDataSchema,
    totalTrend: z.number(),
    totalCarbonLaw: z.number(),
    approximatedHistoricalEmission: InputYearlyDataSchema,
    trend: InputYearlyDataSchema,
    historicalEmissionChangePercent: z.number(),
    meetsParis: z.string().transform((val) => val === 'True'),
  })
)

export const NationDataSchema = z.object({
  country: z.string(),
  logoUrl: z.string().nullable().optional(),
  emissions: z.array(YearlyDataSchema),
  totalTrend: z.number(),
  totalCarbonLaw: z.number(),
  approximatedHistoricalEmission: z.array(YearlyDataSchema),
  trend: z.array(YearlyDataSchema),
  historicalEmissionChangePercent: z.number(),
  meetsParis: z.boolean(),
})

export const NationalDataListSchema = z.array(NationDataSchema)

export const ReportingPeriodYearsSchema = z.array(z.string())

export const ValidationClaimsSchema = z.record(wikidataIdSchema, z.string())

export const ReportsListSchema = z.array(
  z.object({
    companyName: z.string(),
    results: z.array(
      z.object({
        url: z.string().url().optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        position: z.number().optional(),
      })
    ),
  })
)

export const ReportsListResponseSchema = z.object({
  results: ReportsListSchema,
})
