/**
 * This file contains the functions for emissions calculations for companies.
 */

export interface ReportedPeriod {
  year: number
  emissions?: {
    calculatedTotalEmissions?: number
    scope1?: {
      total?: number
    }
    scope2?: {
      mb?: number
      lb: number
      unknown?: number | null
    } | null
    scope3?: {
      calculatedTotalEmissions?: number | null
      statedTotalEmissions?: {
        total: number | null
      }
      categories?: {
        category: number
        total: number | null
      }[]
    }
    statedTotalEmissions?: number | null | undefined
  } | null
}

export interface Company {
  reportedPeriods: ReportedPeriod[]
  baseYear?: number
}

export type EmissionsType = 'scope3' | 'scope1and2'

function hasValidValue(value: number | null | undefined): boolean {
  return value !== null && value !== undefined && !isNaN(value)
}

function hasScope3Data(period: ReportedPeriod): boolean {
  if (!period.emissions?.scope3) return false

  const { scope3 } = period.emissions

  if (
    scope3.statedTotalEmissions?.total &&
    scope3.statedTotalEmissions.total > 0
  ) {
    return true
  }

  return scope3.categories?.some((cat) => cat.total && cat.total > 0) ?? false
}

function hasScope1And2Data(period: ReportedPeriod): boolean {
  if (!period.emissions) return false

  const scope1Total = period.emissions.scope1?.total
  const { scope2 } = period.emissions

  return (
    hasValidValue(scope1Total) ||
    hasValidValue(scope2?.mb) ||
    hasValidValue(scope2?.lb) ||
    hasValidValue(scope2?.unknown)
  )
}

function getPeriodsFromBaseYear(
  periods: ReportedPeriod[],
  baseYear?: number,
): ReportedPeriod[] {
  return baseYear ? periods.filter((p) => p.year >= baseYear) : periods
}

function getValidDataPeriods(
  periods: ReportedPeriod[],
  emissionsType: EmissionsType,
): ReportedPeriod[] {
  return periods.filter((period) =>
    emissionsType === 'scope3'
      ? hasScope3Data(period)
      : hasScope1And2Data(period),
  )
}

export function has3YearsOfReportedData(
  reportedPeriods: ReportedPeriod[],
): boolean {
  return reportedPeriods.length >= 3
}

export function has3YearsOfNonNullData(
  reportedPeriods: ReportedPeriod[],
  emissionsType: EmissionsType,
): boolean {
  const validPeriods = getValidDataPeriods(reportedPeriods, emissionsType)
  return validPeriods.length >= 3
}

export function extractEmissionsArray(
  reportedPeriods: ReportedPeriod[],
  emissionsType: EmissionsType,
  baseYear?: number,
): { year: number; emissions: number | undefined }[] {
  const filteredPeriods = getPeriodsFromBaseYear(reportedPeriods, baseYear)
  const validPeriods =
    emissionsType === 'scope3'
      ? filteredPeriods.filter(hasScope3Data)
      : filteredPeriods

  return validPeriods
    .map((period) => ({
      year: period.year,
      emissions: period.emissions?.calculatedTotalEmissions,
    }))
    .sort((a, b) => a.year - b.year)
}

export function calculateLADTrendSlope(
  y: { year: number; emissions: number }[],
  opts: { maxIter?: number; tol?: number; eps?: number } = {},
): number {
  // LAD algorithm implementation remains the same
  const n = y.length
  const maxIter = opts.maxIter ?? 1000
  const tol = opts.tol ?? 1e-10
  const eps = opts.eps ?? 1e-6

  const years = y.map((item) => item.year)
  const minYear = Math.min(...years)
  const x = years.map((year) => year - minYear)

  // Initialize with OLS for faster convergence
  const mx = x.reduce((sum, val) => sum + val, 0) / n
  const my = y.reduce((sum, item) => sum + item.emissions, 0) / n

  let num = 0,
    den = 0
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx
    num += dx * (y[i].emissions - my)
    den += dx * dx
  }
  let b1 = den === 0 ? 0 : num / den
  let b0 = my - b1 * mx

  // Iteratively reweighted least squares for LAD approximation
  for (let it = 0; it < maxIter; it++) {
    const w = new Array(n)
    for (let i = 0; i < n; i++) {
      const r = y[i].emissions - (b0 + b1 * x[i])
      w[i] = 1 / Math.max(Math.abs(r), eps)
    }

    let S_w = 0,
      S_x = 0,
      S_xx = 0,
      S_y = 0,
      S_xy = 0
    for (let i = 0; i < n; i++) {
      const wi = w[i]
      const xi = x[i]
      const yi = y[i]
      S_w += wi
      S_x += wi * xi
      S_xx += wi * xi * xi
      S_y += wi * yi.emissions
      S_xy += wi * xi * yi.emissions
    }

    const det = S_w * S_xx - S_x * S_x
    if (Math.abs(det) < 1e-18) break

    const newB1 = (S_w * S_xy - S_x * S_y) / det
    const newB0 = (S_y - S_x * newB1) / S_w

    const delta = Math.abs(newB0 - b0) + Math.abs(newB1 - b1)
    b0 = newB0
    b1 = newB1
    if (delta < tol) break
  }

  return b1
}

function determineEmissionsType(
  periods: ReportedPeriod[],
  baseYear?: number,
): EmissionsType | null {
  const relevantPeriods = getPeriodsFromBaseYear(periods, baseYear)

  if (baseYear && !relevantPeriods.some((p) => p.year === baseYear)) {
    return null
  }

  if (relevantPeriods.length < 3) {
    return null
  }

  if (has3YearsOfNonNullData(relevantPeriods, 'scope3')) {
    return 'scope3'
  }

  if (has3YearsOfNonNullData(relevantPeriods, 'scope1and2')) {
    return 'scope1and2'
  }

  return null
}

export function calculateFutureEmissionTrend(
  reportedPeriods: ReportedPeriod[],
  baseYear?: number,
): number | null {
  if (!has3YearsOfReportedData(reportedPeriods)) {
    return null
  }

  const emissionsType = determineEmissionsType(reportedPeriods, baseYear)
  if (!emissionsType) {
    return null
  }

  const emissionsData = extractEmissionsArray(
    reportedPeriods,
    emissionsType,
    baseYear,
  )
  const validEmissionsData = emissionsData.filter(
    (item): item is { year: number; emissions: number } =>
      hasValidValue(item.emissions) && item.emissions !== undefined,
  )

  return validEmissionsData.length >= 3
    ? calculateLADTrendSlope(validEmissionsData)
    : null
}
