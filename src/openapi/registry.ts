import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import {
  ErrorSchema as ErrorSchemaBase,
  CompanyInputSchema as CompanyInputSchemaBase,
  CompanyList,
  CompanyDetails,
} from './schemas'
import {
  goalSchema,
  postGoalsSchema,
  postEmissionsSchema,
  reportingPeriodSchema,
  postIndustrySchema,
  postInitiativeSchema,
  postInitiativesSchema,
  postEconomySchema,
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

// ¨
// // Register emissions schemas
// export const Scope1 = registry.register('Scope1', Scope1Schema)
// export const Scope2 = registry.register('Scope2', Scope2Schema)
// export const Scope3 = registry.register('Scope3', Scope3Schema)
// export const Biogenic = registry.register('Biogenic', BiogenicSchema)
// export const StatedTotalEmissions = registry.register('StatedTotalEmissions', StatedTotalEmissionsSchema)

// // Register economy schemas
// export const Turnover = registry.register('Turnover', TurnoverSchema)
// export const Employees = registry.register('Employees', EmployeesSchema)
registry.register('Economy', postEconomySchema)
registry.register('Goal', goalSchema)
registry.register('Goals', postGoalsSchema)
registry.register('Industry', postIndustrySchema)
registry.register('Initiative', postInitiativeSchema)
registry.register('Initiatives', postInitiativesSchema)
registry.register('ReportingPeriod', reportingPeriodSchema)
registry.register('Emissions', postEmissionsSchema)
