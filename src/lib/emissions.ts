export type Unit = 'tCO2' | 'tCO2e'
export interface Scope1 {
  id?: string
  total: number | null
  unit: string
}

export interface Scope2 {
  id?: string
  mb?: number | null
  lb?: number | null
  unknown?: number | null
  unit: string
}

export interface Scope3Category {
  id?: string
  category: number
  total: number | null
  unit: string
}
export interface Scope3 {
  categories: Scope3Category[]
  statedTotalEmissions?: StatedTotalEmission
}

export interface StatedTotalEmission {
  id?: string
  total: number | null
  unit: string
}

export interface Scope1And2 {
  id?: string
  total: number | null
  unit: string
}

export interface Emissions {
  id?: string
  scope1?: Scope1 | null
  scope2?: Scope2 | null
  scope3?: Scope3 | null
  scope1And2?: Scope1And2 | null
  statedTotalEmissions?: StatedTotalEmission
}

export interface ReportingPeriod {
  id?: string
  startDate: string
  endDate: string
  reportURL: string
  emissions: Emissions
}
