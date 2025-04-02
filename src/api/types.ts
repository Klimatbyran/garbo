import { Prisma } from '@prisma/client'
import { z } from 'zod'

import * as schemas from './schemas'
import { economyArgs, emissionsArgs, reportingPeriodArgs } from './args'

export type WikidataIdParams = z.infer<typeof schemas.wikidataIdParamSchema>

export type CompanySearchQuery = z.infer<typeof schemas.companySearchQuerySchema>

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