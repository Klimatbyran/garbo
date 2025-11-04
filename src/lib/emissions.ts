export function calculatedTotalEmissions(emissions: Emissions) {
  const { scope1, scope2, scope3, scope1And2 } = emissions || {}
  const scope1Total = scope1?.total ?? 0
  const scope2Total = scope2?.mb ?? scope2?.lb ?? scope2?.unknown ?? 0
  const scope3Total =
    scope3?.categories.reduce(
      (total, category) => (category.total ?? 0) + total,
      0,
    ) ||
    (scope3?.statedTotalEmissions?.total ?? 0) ||
    0

  // Calculate scope 1+2 emissions: use separate values if available, otherwise fall back to combined scope1And2
  const hasSeparateScope1Or2 = scope1Total > 0 || scope2Total > 0
  const scope1And2Total = hasSeparateScope1Or2
    ? scope1Total + scope2Total
    : (scope1And2?.total ?? 0)

  return scope1And2Total + scope3Total
}

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
