/**
 * This file contains the functions for emissions calculations for companies.
 *
 * ASSUMPTIONS FOR FUTURE TREND CALCULATIONS:
 *
 * 1. MINIMUM DATA REQUIREMENT: 3 years
 *    - Statistical significance for trend calculation
 *    - Business requirement for reliable projections
 *    - Prevents overfitting with insufficient data
 *
 * 2. SCOPE 3 PRIORITY: Scope 3 data takes precedence over Scope 1&2
 *    - When companies start reporting scope 3 emissions often dramatically rise impacting the trend calculation
 *    - Regulatory reporting standard for most companies
 *    - Better represents total company environmental impact
 *
 * 3. LAD REGRESSION: Approximates LAD using weighted regression
 *    - More robust to outliers and extreme values
 *    - Better handles companies with irregular reporting patterns
 *    - Reduces impact of data quality issues
 *    - Not using LAD directly to avoid complex implementation
 *
 * 4. CONVERGENCE PARAMETERS:
 *    - Max iterations: 1000 (prevents infinite loops)
 *    - Tolerance: 1e-10 (numerical precision for convergence)
 *    - Epsilon: 1e-6 (prevents division by zero in weights)
 *
 * 5. DATA VALIDATION: Only uses calculatedTotalEmissions
 *    - Pre-calculated using best available scope data
 *    - Consistent data source regardless of scope type
 *    - Handles different reporting formats uniformly
 *
 * 6. BASE YEAR FILTERING: Optional base year parameter
 *    - Allows focusing on specific reporting periods
 *    - Must have base year present in data if specified
 *    - Still requires minimum 3 years after filtering
 *
 * 7. DATA QUALITY ASSUMPTIONS:
 *    - Zero emissions are valid (not missing data)
 *    - Negative emissions are not expected (data quality issue)
 *    - NaN/null values indicate missing/invalid data
 *    - Scope data validation ensures appropriate data type usage
 */

export interface ReportedPeriod {
  year: number
  emissions?: {
    calculatedTotalEmissions?: number | null
    scope1?: {
      total?: number
    }
    scope2?: {
      mb?: number
      lb: number
      unknown?: number | null
    } | null
    scope1And2?: {
      total?: number | null
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

export function hasValidValue(value: number | null | undefined): boolean {
  return value !== null && value !== undefined && !isNaN(value)
}

export function hasScope3Data(period: ReportedPeriod): boolean {
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

export function hasScope1And2Data(period: ReportedPeriod): boolean {
  if (!period.emissions) return false

  const scope1Total = period.emissions.scope1?.total
  const { scope2, scope1And2 } = period.emissions

  return (
    hasValidValue(scope1Total) ||
    hasValidValue(scope2?.mb) ||
    hasValidValue(scope2?.lb) ||
    hasValidValue(scope2?.unknown) ||
    hasValidValue(scope1And2?.total)
  )
}

export function getPeriodsFromBaseYear(
  periods: ReportedPeriod[],
  baseYear?: number
): ReportedPeriod[] {
  return baseYear ? periods.filter((p) => p.year >= baseYear) : periods
}

export function getValidDataPeriods(
  periods: ReportedPeriod[],
  emissionsType: EmissionsType
): ReportedPeriod[] {
  if (emissionsType === 'scope1and2' && periods.some(hasScope3Data)) {
    return []
  }

  return periods.filter((period) =>
    emissionsType === 'scope3'
      ? hasScope3Data(period)
      : hasScope1And2Data(period) && !hasScope3Data(period)
  )
}

export function has3YearsOfNonNullData(
  reportedPeriods: ReportedPeriod[],
  emissionsType: EmissionsType
): boolean {
  const validPeriods = getValidDataPeriods(reportedPeriods, emissionsType)
  return validPeriods.length >= 3
}

export function extractEmissionsArray(
  reportedPeriods: ReportedPeriod[],
  emissionsType: EmissionsType,
  baseYear?: number
): { year: number; emissions: number | null | undefined }[] {
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
  opts: { maxIter?: number; tol?: number; eps?: number } = {}
): number {
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

  // Return b1; callers should check isFinite(b1) for invalid/NaN inputs
  return b1
}

export function determineEmissionsType(
  periods: ReportedPeriod[],
  baseYear?: number
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
  baseYear?: number
): number | null {
  try {
    // Check if we can determine emissions type
    const emissionsType = determineEmissionsType(reportedPeriods, baseYear)
    if (!emissionsType) {
      return null
    }

    // Extract and filter emissions data
    const emissionsData = extractEmissionsArray(
      reportedPeriods,
      emissionsType,
      baseYear
    )
    const validEmissionsData = emissionsData.filter(
      (item): item is { year: number; emissions: number } =>
        hasValidValue(item.emissions) && item.emissions !== undefined
    )

    // Check if we have enough data for trend calculation (need 3+ points)
    if (validEmissionsData.length < 3) {
      return null
    }

    // Calculate trend slope
    return calculateLADTrendSlope(validEmissionsData)
  } catch (error) {
    // Log error for debugging but don't crash
    console.warn('Error calculating future emission trend:', error)
    return null
  }
}
