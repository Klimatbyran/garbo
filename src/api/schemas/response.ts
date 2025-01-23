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

/*





Then maybe add the example ad hoc manually in the JSON schema transform?
NOTE: It seems like none of the .openapi() calls actually work as expected. Might be better to add examples manually for each endpoint?
Maybe we could remove astea-solutions-zod since we dont use it if it's not useful?






 */

/**
 * Get an array of numbers from start to end, with inclusive boundaries.
 */
export function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

// TODO: use better year schemas
// const climateDataYears = range(1990, 2100)

// const YearSchema = z.number().min(1990).max(2100)

const YearlyData = z.record(z.string().regex(/\d{4}/), z.number())
// const YearlyData = z.record(
//   z.string().date().openapi({ pattern: 'YYYY' }),
//   z.number()
// )
// .openapi({ example: { '2030': 5298.485 } })

// IDEA: See if it's possible to improve the schema for the yearly data
// We might for example be able to define that the keys should be four digit year strings, between
export const MunicipalitySchema = z.object({
  name: z.string(),
  region: z.string(),
  emissions: YearlyData,
  budget: z.number(),
  emissionBudget: YearlyData,
  approximatedHistoricalEmission: YearlyData,
  totalApproximatedHistoricalEmission: z.number(),
  trend: YearlyData,
  trendEmission: z.number(),
  historicalEmissionChangePercent: z.number(),
  neededEmissionChangePercent: z.number(),
  hitNetZero: z.string(),
  budgetRunsOut: z.string(),
  electricCarChangePercent: z.number(),
  electricCarChangeYearly: YearlyData,
  climatePlanLink: z.string(),
  climatePlanYear: z.union([ClimatePlanYearEnumSchema, z.number()]),
  climatePlanComment: z.string(),
  bicycleMetrePerCapita: z.number(),
  totalConsumptionEmission: z.number(),
  electricVehiclePerChargePoints: z.number(),
  procurementScore: z.string(),
  procurementLink: z.string(),
})
// IDEA: Add an example to make it easier to see it in action
// .openapi({
//   example: {
//     name: 'Borås',
//     region: 'Västra Götalands län',
//     emissions: {
//       '1990': 396555.825518647,
//       '2000': 291563.906229046,
//       '2005': 301791.034669901,
//       '2010': 306953.831737827,
//       '2015': 237247.290285871,
//       '2016': 236423.864824126,
//       '2017': 233451.264481917,
//       '2018': 229427.286373341,
//       '2019': 227117.00904579,
//       '2020': 211623.571089559,
//       '2021': 211715.680273485,
//       '2022': 195210.46458019,
//     },
//     budget: 379277.18106000824,
//     emissionBudget: {
//       '2024': 190982.33564206026,
//       '2025': 115426.96931902014,
//       '2026': 69762.3955712048,
//       '2027': 42163.38577150274,
//       '2028': 25482.94228087468,
//       '2029': 15401.522800127961,
//       '2030': 9308.458259974508,
//       '2031': 5625.897925948448,
//       '2032': 3400.2115698671796,
//       '2033': 2055.0388350513026,
//       '2034': 1242.035834180159,
//       '2035': 750.6685455650253,
//       '2036': 453.6932428142596,
//       '2037': 274.20565280297626,
//       '2038': 165.7259419662295,
//       '2039': 100.16236922850166,
//       '2040': 60.53669142222199,
//       '2041': 36.58750323675968,
//       '2042': 22.11295929213119,
//       '2043': 13.36475368355188,
//       '2044': 8.077464380155288,
//       '2045': 4.8819029783523575,
//       '2046': 2.9505517534188606,
//       '2047': 1.7832709269739124,
//       '2048': 1.0777832299689751,
//       '2049': 0.6513966404272278,
//       '2050': 0.3936947350462053,
//     },
//     approximatedHistoricalEmission: {
//       '2022': 195210.46458019,
//       '2023': 196763.1935015563,
//       '2024': 190982.33564206026,
//     },
//     totalApproximatedHistoricalEmission: 389859.59361268143,
//     trend: {
//       '2024': 190982.33564206026,
//       '2025': 185201.47778256424,
//       '2026': 179420.6199230682,
//       '2027': 173639.76206357218,
//       '2028': 167858.90420407616,
//       '2029': 162078.04634457827,
//       '2030': 156297.18848508224,
//       '2031': 150516.3306255862,
//       '2032': 144735.47276609018,
//       '2033': 138954.61490659416,
//       '2034': 133173.75704709813,
//       '2035': 127392.8991876021,
//       '2036': 121612.04132810608,
//       '2037': 115831.18346860819,
//       '2038': 110050.32560911216,
//       '2039': 104269.46774961613,
//       '2040': 98488.6098901201,
//       '2041': 92707.75203062408,
//       '2042': 86926.89417112805,
//       '2043': 81146.03631163202,
//       '2044': 75365.178452136,
//       '2045': 69584.3205926381,
//       '2046': 63803.46273314208,
//       '2047': 58022.60487364605,
//       '2048': 52241.74701415002,
//       '2049': 46460.889154653996,
//       '2050': 40680.03129515797,
//     },
//     trendEmission: 3011610.7701838342,
//     historicalEmissionChangePercent: -2.7013222645676223,
//     neededEmissionChangePercent: 39.561442197798996,
//     hitNetZero: '2057-01-05',
//     budgetRunsOut: '2026-01-19',
//     electricCarChangePercent: 0.0688514886498573,
//     electricCarChangeYearly: {
//       '2015': 0.01661392405063291,
//       '2016': 0.02943848809740142,
//       '2017': 0.036084381939304216,
//       '2018': 0.04981242184243435,
//       '2019': 0.07324494675070636,
//       '2020': 0.24108953926398147,
//       '2021': 0.36672231496939345,
//       '2022': 0.5107079119571684,
//     },
//     climatePlanLink:
//       'https://www.boras.se/download/18.499cdee21538963cd3f57af7/1610014986050/Energi-%20och%20klimatstrategi%20-%20strategi.pdf',
//     climatePlanYear: 2020,
//     climatePlanComment:
//       'Energi– och klimatstrategi 2020–2024 kopplad till Borås koldioxidbudget.',
//     bicycleMetrePerCapita: 1.8684201340407707,
//     totalConsumptionEmission: 6052.0,
//     electricVehiclePerChargePoints: 17.791411042944784,
//     procurementScore: '2',
//     procurementLink:
//       'https://drive.google.com/file/d/1qw6EEOaJbPcGIFmXXKMP1hVRfc6V_mqm/view?usp=drive_link',
//   },
// })

export const MunicipalitiesSchema = z.array(MunicipalitySchema)

// type MAXIMUM_ALLOWED_BOUNDARY = 999

// type ComputeRange<N extends number, Result extends Array<unknown> = []> =
//   /**
//    * If length of Result is equal to N,
//    * stop recursion and return Result
//    */
//   Result['length'] extends N
//     ? Result
//     : /**
//        * Otherwise, call ComputeRange recursively with same N,
//        * but with extendsd Result - add Result.length to current Result
//        *
//        * First step:
//        * Result is [] -> ComputeRange is called with [...[], 0]
//        *
//        * Second step:
//        * Result is [0] -> ComputeRange is called with [...[0], 1]
//        *
//        * Third step:
//        * Result is [0, 1] -> ComputeRange is called with [...[0, 1], 2]
//        *
//        * ComputeRange is called until Result will meet a length requirement
//        */
//       ComputeRange<N, [...Result, Result['length']]>

// // 0 , 1, 2 ... 998
// type NumberRange = ComputeRange<MAXIMUM_ALLOWED_BOUNDARY>[number]

// // Pure js representation of ComputeRange utility type

// const ComputeRange = (N: number, Result: number[] = []): number[] => {
//   if (Result.length === N) {
//     return Result
//   }
//   return ComputeRange(N, [...Result, Result.length])
// }

// type Enumerate1<
//   N extends number,
//   Acc extends number[] = []
// > = Acc['length'] extends N
//   ? Acc[number]
//   : Enumerate1<N, [...Acc, Acc['length']]>

// type Enumerate2<N extends number> = Partial<
//   Record<keyof any, never>
// > extends infer O
//   ? { [K in keyof O]: K extends N ? never : K }
//   : never

// type RangedNumber<F extends number, T extends number> = Exclude<
//   Enumerate1<T>,
//   Enumerate1<F>
// >

// // NOTE: This only works for small numbers
// type YearsValid = RangedNumber<1990, 2101>

// Best solution might be to define the years as keys of an object, and then use that for the schema and type
// Alternatively, just add a better example, because the parsing is fine, so it's really just about adding a better example request body
