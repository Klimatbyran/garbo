import { Prisma } from '@prisma/client'
import { z } from 'zod'

import * as schemas from './schemas'
import {
  companyListArgs,
  economyArgs,
  emissionsArgs,
  reportingPeriodArgs,
} from './args'

export type WikidataIdParams = z.infer<typeof schemas.wikidataIdParamSchema>

export type CompanySearchQuery = z.infer<
  typeof schemas.companySearchQuerySchema
>

export type DefaultEmissions = Prisma.EmissionsGetPayload<typeof emissionsArgs>

export type DefaultEconomyType = Prisma.EconomyGetPayload<typeof economyArgs>

export type DefaultReportingPeriod = Prisma.ReportingPeriodGetPayload<
  typeof reportingPeriodArgs
>

export type PostGoalBody = z.infer<typeof schemas.postGoalSchema>
export type PostGoalsBody = z.infer<typeof schemas.postGoalsSchema>

export type PostIndustryBody = z.infer<typeof schemas.postIndustrySchema>
export type PostInitiativeBody = z.infer<typeof schemas.postInitiativeSchema>
export type PostInitiativesBody = z.infer<typeof schemas.postInitiativesSchema>
export type PostReportingPeriodsBody = z.infer<
  typeof schemas.postReportingPeriodsSchema
>
export type PostBaseYearBody = z.infer<typeof schemas.postBaseYear>
export type PostCompanyBody = z.infer<typeof schemas.postCompanyBodySchema>

export type GarboEntityId = z.infer<typeof schemas.garboEntityIdSchema>

export type Municipality = z.infer<typeof schemas.MunicipalitySchema>

export type MunicipalityNameParams = z.infer<
  typeof schemas.MunicipalityNameParamSchema
>

export type userAuthenticationBody = z.infer<
  typeof schemas.userAuthenticationBodySchema
>

export type serviceAuthenticationBody = z.infer<
  typeof schemas.serviceAuthenticationBodySchema
>

export type exportQuery = z.infer<typeof schemas.exportQuerySchema>

export type CompanyExpandedQuery = z.infer<
  typeof schemas.companyExpandedQuerySchema
>

export type ValidationClaims = z.infer<typeof schemas.ValidationClaimsSchema>
export type ClaimValidation = z.infer<typeof schemas.claimValidationSchema>
export type Description = z.infer<typeof schemas.descriptionSchema>

export type CompanyListPayload = Prisma.CompanyGetPayload<
  typeof companyListArgs
>

// Types for processed companies (incremental additions through pipeline)
// Using more flexible types to accommodate transformations

export type CompanyWithMetadata = CompanyListPayload & {
  // Metadata transformation may modify structure slightly
  [key: string]: unknown
}

export type CompanyWithCalculatedEmissions = CompanyWithMetadata & {
  reportingPeriods: Array<
    CompanyListPayload['reportingPeriods'][0] & {
      emissions?:
        | (NonNullable<
            CompanyListPayload['reportingPeriods'][0]['emissions']
          > & {
            calculatedTotalEmissions: number
            scope2?:
              | (NonNullable<
                  NonNullable<
                    CompanyListPayload['reportingPeriods'][0]['emissions']
                  >['scope2']
                > & {
                  calculatedTotalEmissions: number
                })
              | null
            scope3?:
              | (NonNullable<
                  NonNullable<
                    CompanyListPayload['reportingPeriods'][0]['emissions']
                  >['scope3']
                > & {
                  calculatedTotalEmissions: number
                })
              | null
          })
        | null
    }
  >
}

export type CompanyWithEmissionChange = CompanyWithCalculatedEmissions & {
  reportingPeriods: Array<
    CompanyWithCalculatedEmissions['reportingPeriods'][0] & {
      emissionsChangeLastTwoYears?: {
        absolute: number | null
        adjusted: number | null
        absoluteDifference?: number | null
        adjustedDifference?: number | null
      }
    }
  >
}

export type CompanyWithTrend = CompanyWithEmissionChange & {
  futureEmissionsTrendSlope: number | null
  emissionsTrendPercent: number | null
}

export type ProcessedCompany = CompanyWithTrend & {
  meetsParisGoal: boolean | null
  dateTrendExceedsCarbonLaw: Date | null
  futureEmissionsTrendTotal: number | null
  carbonLawCalculatedBudget: number | null
}

export type CompanyWithoutAnalysisFields = Omit<
  ProcessedCompany,
  | 'futureEmissionsTrendSlope'
  | 'emissionsTrendPercent'
  | 'meetsParisGoal'
  | 'dateTrendExceedsCarbonLaw'
  | 'futureEmissionsTrendTotal'
  | 'carbonLawCalculatedBudget'
>

export type CompanyWithAnalysis = CompanyWithoutAnalysisFields & {
  analysis: {
    futureEmissionsTrendSlope: number | null
    emissionsTrendPercent: number | null
    meetsParisGoal: boolean | null
    dateTrendExceedsCarbonLaw: Date | null
    futureEmissionsTrendTotal: number | null
    carbonLawCalculatedBudget: number | null
  }
}
