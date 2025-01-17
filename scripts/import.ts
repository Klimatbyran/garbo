export type CompanyInput = {
  wikidataId: string
  name: string
  description?: string
  tags?: string[]
  internalComment?: string
  initiatives?: InitiativeInput[]
  goals?: GoalInput[]
  reportingPeriods: ReportingPeriodInput[]
}

export type InitiativeInput = {
  //
}
export type GoalInput = {
  //
}

export type MetadataInput = {
  comment?: string
  source?: string
}

export type ReportingPeriodInput = {
  startDate: Date
  endDate: Date
  reportURL?: string
  companyId: string
  emissions?: EmissionsInput
  economy?: EconomyInput
}

export type EmissionsInput = {
  scope1?: Scope1Input
  scope2?: Scope2Input
  scope3?: Scope3Input
  statedTotalEmissions?: StatedTotalEmissionsInput
  biogenic?: BiogenicInput
  scope1And2?: Scope1And2Input
}

export type Scope1Input = {
  total?: number
}

export type Scope2Input = {
  mb?: number
  lb?: number
  unknown?: number
}

export type Scope1And2Input = {
  total?: number
}

export type Scope3Input = {
  categories?: Scope3CategoryInput[]
  statedTotalEmissions?: StatedTotalEmissionsInput
}

export type Scope3CategoryInput = {
  category: number
  total: number
}

export type StatedTotalEmissionsInput = {
  total: number
}

export type BiogenicInput = {
  total: number
}

export type EconomyInput = {
  turnover?: {
    value?: number
    currency?: string
  }
  employees?: {
    value?: number
    unit?: string
  }
}
