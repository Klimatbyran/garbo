export enum FollowUpType {
  IndustryGics = 'followUp/industryGics',
  Scope12 = 'followUp/scope12',
  Scope3 = 'followUp/scope3',
  Biogenic = 'followUp/biogenic',
  Economy = 'followUp/economy',
  Goals = 'followUp/goals',
  Initiatives = 'followUp/initiatives',
  FiscalYear = 'followUp/fiscalYear',
  CompanyTags = 'followUp/companyTags',
  BaseYear = 'followUp/baseYear',
  Lei = 'extractLEI',
  Wikidata = 'wikidata',
  Precheck = 'precheck',
  ExtractEmissions = 'extractEmissions',
}

export type Unit = 'tCO2' | 'tCO2e'
export interface Emission {
  total?: number
  unit: Unit
}

export interface Company {
  reportingPeriods: ReportingPeriod[]
  futureEmissionsTrendSlope: number | null
  carbonLawSum: number
  industry: Industry
  baseYear: BaseYear
  goals: Goal[]
  initiatives: Initiative[]
  tags: string[]
  description: string | null
  descriptions: Description[]
  wikidataId: string
  name: string
  url: string | null
  lei: string | null
}

interface BaseYear {
  id: string
  year: number
}

interface Description {
  id: string
  text: string
  language: string
}

export interface Scope2 {
  mb?: number
  lb?: number
  unknown?: number
  unit: Unit
}

export interface Scope3Category {
  category: number
  total: number
  unit: Unit
}
export interface Scope3 {
  categories: Scope3Category[]
  statedTotalEmissions?: Emission
  calculatedTotalEmissions?: number
}

export interface Emissions {
  calculatedTotalEmissions?: number
  scope1?: Emission
  scope2?: Scope2
  scope3?: Scope3
  statedTotalEmissions?: Emission
  biogenic?: Emission
}

export interface Economy {
  turnover?: Turnover
  employees?: Employees
}

export interface Turnover {
  value: number
  currency: string
}

export interface Employees {
  value: number
  unit: 'FTE' | 'EOY' | 'AVG'
}

export interface ReportingPeriod {
  id?: string
  startDate: string
  endDate: string
  reportURL: string
  emissions: Emissions
  economy: Economy
}

export interface Goal {
  description: string
  year?: string
  target?: number
  baseYear?: string
}

export interface Industry {
  subIndustryCode: string
  industryGics?: {
    sectorCode?: string
    groupCode?: string
    industryCode?: string
    subIndustryCode?: string
  }
}

export interface Initiative {
  title: string
  description?: string
  year?: string
  scope?: string
}

export interface Logger {
  info(message: string, meta?: unknown): void
  error(message: string, meta?: unknown): void
}
