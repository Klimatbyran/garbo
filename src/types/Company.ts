export interface ReportingPeriod {
  id: number
  startDate: Date
  endDate: Date
  companyId: string
  emissionsId: number | null
  economyId: number | null
  metadataId: number
}

export type Emissions = {
  id: number
  scope1Id?: number
  scope2Id?: number
}

export type Scope1 = {
  total?: number
}

export type Scope2 = {
  mb?: number
  lb?: number
  unknown?: number
}

export enum JobType {
  IndustryGics = 'followUp/industry_gics',
  Scope12 = 'followUp/scope12',
  Scope3 = 'followUp/scope3',
  Biogenic = 'followUp/biogenic',
  Economy = 'followUp/economy',
  Goals = 'followUp/goals',
  Initiatives = 'followUp/initiatives',
  FiscalYear = 'followUp/fiscalYear',

  Wikidata = 'wikidata',
  Precheck = 'precheck',
  ExtractEmissions = 'extractEmissions',
}
