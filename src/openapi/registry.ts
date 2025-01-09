import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import {
  ErrorSchema as ErrorSchemaBase,
  CompanyInputSchema as CompanyInputSchemaBase,
  CompanyList,
  CompanyDetails,
} from './schemas'
import {
  postGoalsSchema,
  postEmissionsSchema,
  postIndustrySchema,
  postInitiativeSchema,
  postInitiativesSchema,
  postEconomySchema,
  postReportingPeriodsSchema,
  postGoalSchema,
} from '../api/schemas'

export const registry = new OpenAPIRegistry()

// Register all schemas
export const ErrorSchema = registry.register('Error', ErrorSchemaBase)

export const CompanyInputSchema = registry.register(
  'CompanyInput',
  CompanyInputSchemaBase
)

export const CompanySchema = registry.register('CompanyDetails', CompanyDetails)
export const CompanyListSchema = registry.register('CompanyList', CompanyList)

registry.register('Economy', postEconomySchema)
registry.register('Goal', postGoalSchema)
registry.register('Goals', postGoalsSchema)
registry.register('Industry', postIndustrySchema)
registry.register('Initiative', postInitiativeSchema)
registry.register('Initiatives', postInitiativesSchema)
registry.register('ReportingPeriod', postReportingPeriodsSchema)
registry.register('Emissions', postEmissionsSchema)
