import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import {
  EmissionsSchema,
  EconomySchema,
  ErrorSchema as ErrorSchemaBase,
  CompanyInputSchema as CompanyInputSchemaBase,
  Scope1Schema,
  Scope2Schema,
  Scope3Schema,
  BiogenicSchema,
  StatedTotalEmissionsSchema,
  TurnoverSchema,
  EmployeesSchema,
  GoalSchema,
  InitiativeSchema
} from './schemas'

export const registry = new OpenAPIRegistry()

// Register all schemas
export const ErrorSchema = registry.register('Error', ErrorSchemaBase)
export const CompanyInputSchema = registry.register('CompanyInput', CompanyInputSchemaBase)
export const CompanySchema = registry.register('Company', CompanyInputSchemaBase.extend({}))

// Register emissions schemas
export const Scope1 = registry.register('Scope1', Scope1Schema)
export const Scope2 = registry.register('Scope2', Scope2Schema)
export const Scope3 = registry.register('Scope3', Scope3Schema)
export const Biogenic = registry.register('Biogenic', BiogenicSchema)
export const StatedTotalEmissions = registry.register('StatedTotalEmissions', StatedTotalEmissionsSchema)
export const Emissions = registry.register('Emissions', EmissionsSchema)

// Register economy schemas
export const Turnover = registry.register('Turnover', TurnoverSchema)
export const Employees = registry.register('Employees', EmployeesSchema)
export const Economy = registry.register('Economy', EconomySchema)
export const Goal = registry.register('Goal', GoalSchema)
export const Initiative = registry.register('Initiative', InitiativeSchema)
export const Industry = registry.register('Industry', IndustrySchema)
