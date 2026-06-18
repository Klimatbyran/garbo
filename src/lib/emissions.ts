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
  total?: number | null
  mb?: number | null
  lb?: number | null
  unknown?: number | null
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

/** Resolve the best single total from a StatedTotalEmission: mb > lb > unknown > total (legacy). */
export function resolveStatedTotal(
  s: StatedTotalEmission | null | undefined
): number | null {
  return s?.mb ?? s?.lb ?? s?.unknown ?? s?.total ?? null
}

export interface ReportingPeriod {
  id?: string
  startDate: string
  endDate: string
  reportURL: string
  emissions: Emissions
}
