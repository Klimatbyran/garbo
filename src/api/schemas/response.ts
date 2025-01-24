import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { wikidataIdSchema } from './common'

extendZodWithOpenApi(z)

export const okResponseSchema = z.object({ ok: z.boolean() })
export const emptyBodySchema = z.undefined()

export const MetadataSchema = z.object({
  id: z.string(),
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

const CompanyBaseSchema = z.object({
  wikidataId: wikidataIdSchema,
  name: z.string(),
  description: z
    .string()
    .nullable()
    .openapi({ description: 'Company description' }),
})

export const StatedTotalEmissionsSchema = z.object({
  id: z.string(),
  total: z.number().openapi({ description: 'Total emissions value' }),
  unit: z.string().openapi({ description: 'Unit of measurement' }),
  metadata: MetadataSchema,
})

export const BiogenicSchema = z.object({
  id: z.string(),
  total: z.number().openapi({ description: 'Total biogenic emissions' }),
  unit: z.string().openapi({ description: 'Unit of measurement' }),
  metadata: MetadataSchema,
})

export const Scope1Schema = z.object({
  id: z.string(),
  total: z.number().openapi({ description: 'Total scope 1 emissions' }),
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
    .openapi({ description: 'Total emissions for this category' }),
  unit: z.string().openapi({ description: 'Unit of measurement' }),
  metadata: MetadataSchema,
})

export const Scope3Schema = z.object({
  id: z.string(),
  categories: z.array(Scope3CategorySchema),
  statedTotalEmissions: StatedTotalEmissionsSchema.nullable(),
  calculatedTotalEmissions: z
    .number()
    .openapi({ description: 'Calculated total scope 3 emissions' }),
  metadata: MetadataSchema,
})

export const Scope1And2Schema = z.object({
  id: z.string(),
  total: z.number(),
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

const MinimalReportingPeriodSchema = ReportingPeriodSchema.omit({
  id: true,
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

const ClimatePlanYearEnumSchema = z.enum(['Saknar plan'])

// IDEA: See if it's possible to improve the schema for the yearly data
const YearlyDataSchema = z.object({
  year: z.string(),
  value: z.number()
})

export const MunicipalitySchema = z.object({
  name: z.string(),
  region: z.string(),
  emissions: z.array(YearlyDataSchema),
  budget: z.number(),
  emissionBudget: z.array(YearlyDataSchema),
  approximatedHistoricalEmission: z.array(YearlyDataSchema),
  totalApproximatedHistoricalEmission: z.number(),
  trend: z.array(YearlyDataSchema),
  trendEmission: z.number(),
  historicalEmissionChangePercent: z.number(),
  neededEmissionChangePercent: z.number(),
  hitNetZero: z.string(),
  budgetRunsOut: z.string(),
  electricCarChangePercent: z.number(),
  electricCarChangeYearly: z.array(YearlyDataSchema),
  climatePlanLink: z.string(),
  climatePlanYear: z.union([ClimatePlanYearEnumSchema, z.number()]),
  climatePlanComment: z.string(),
  bicycleMetrePerCapita: z.number(),
  totalConsumptionEmission: z.number(),
  electricVehiclePerChargePoints: z.number(),
  procurementScore: z.string(),
  procurementLink: z.string(),
})

export const MunicipalitiesSchema = z.array(MunicipalitySchema)
