/**
 * This file contains the functions for emissions calculations for companies.
 */

// TODO needs to be discussed:
// - do we want to use calculatedTotalEmissions (or statedTotalEmissions) for scope 3?
// - do we want to use calculatedTotalEmissions, categories for scope 3, as well as statedTotalEmissions? This is relevant for sums and checks

// todo i need to check
// todo hur gör jag med år utan data med som har en rapporteringsperiod?
// todo OBS kolla att de tre rapporterade åren inte har null i sig
// todo printa xlsx med alla resultat

import {
  checkDataReportedForBaseYear,
  checkDataReportedFor3YearsAfterBaseYear,
  checkScope3DataFor3YearsAfterBaseYear,
  checkOnlyScope1And2DataFor3YearsAfterBaseYear,
  checkScope3DataFor3Years,
  checkScope1And2DataFor3Years,
  checkForNulls,
  checkForScope3Data,
} from './companyEmissionsFutureTrendChecks'

export interface ReportedPeriod {
  year: number
  emissions: {
    calculatedTotalEmissions: number
    scope1?: {
      total: number
    }
    scope2?: {
      mb: number
      lb: number
      unknown: number
    }
    scope3?: {
      statedTotalEmissions?: {
        total: number
      }
      categories: {
        category: number
        total: number
      }[]
    }
  }
}

interface Company {
  reportedPeriods: ReportedPeriod[]
  baseYear?: number
}

export type EmissionsType = 'scope3' | 'scope1and2'

export function has3YearsOfReportedData(reportedPeriods: ReportedPeriod[]) {
  return reportedPeriods.length >= 3
}

export function has3YearsOfNonNullData(
  reportedPeriods: ReportedPeriod[],
  emissionsType: EmissionsType,
) {
  let filteredPeriods

  switch (emissionsType) {
    case 'scope3':
      filteredPeriods = reportedPeriods.filter(
        (period) =>
          checkForNulls(period.emissions.scope3?.statedTotalEmissions?.total) ||
          (period.emissions.scope3?.categories &&
            period.emissions.scope3.categories.some((category) =>
              checkForNulls(category.total),
            )),
      )
      break
    case 'scope1and2':
      filteredPeriods = reportedPeriods.filter(
        (period) =>
          checkForNulls(period.emissions.scope1?.total) ||
          checkForNulls(period.emissions.scope2?.mb) ||
          checkForNulls(period.emissions.scope2?.lb) ||
          checkForNulls(period.emissions.scope2?.unknown),
      )
      break
    default:
      filteredPeriods = reportedPeriods.filter((period) =>
        checkForNulls(period.emissions.calculatedTotalEmissions),
      )
  }

  return filteredPeriods.length >= 3
}

export function extractScope3EmissionsArray(reportedPeriods: ReportedPeriod[]) {
  return reportedPeriods
    .filter((period) => period.emissions.scope3)
    .map((period) => {
      if (checkForScope3Data(period)) {
        return period.emissions.calculatedTotalEmissions
      }
    })
}

export function extractScope1And2EmissionsArray(
  reportedPeriods: ReportedPeriod[],
) {
  return reportedPeriods.map(
    (period) => period.emissions.calculatedTotalEmissions,
  )
}

export function extractEmissionsArray(
  reportedPeriods: ReportedPeriod[],
  emissionsType: EmissionsType,
) {
  if (emissionsType === 'scope3') {
    return extractScope3EmissionsArray(reportedPeriods)
  }

  return extractScope1And2EmissionsArray(reportedPeriods)
}

export function calculateLADTrendSlope(
  y: number[],
  opts: { maxIter?: number; tol?: number; eps?: number } = {},
): number {
  const n = y.length

  const maxIter = opts.maxIter ?? 1000
  const tol = opts.tol ?? 1e-10
  const eps = opts.eps ?? 1e-6

  // Precompute x = 0..n-1
  const x = Array.from({ length: n }, (_, i) => i)

  // init with ordinary least squares for faster convergence
  const mx = (n - 1) / 2
  const my = y.reduce((a, b) => a + b, 0) / n
  let num = 0,
    den = 0
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx
    num += dx * (y[i] - my)
    den += dx * dx
  }
  let b1 = den === 0 ? 0 : num / den // slope
  let b0 = my - b1 * mx // intercept

  // IRLS loop for L1 (τ=0.5)
  for (let it = 0; it < maxIter; it++) {
    // weights w_i = 1 / max(|r_i|, eps)
    const w = new Array(n)
    for (let i = 0; i < n; i++) {
      const r = y[i] - (b0 + b1 * x[i])
      w[i] = 1 / Math.max(Math.abs(r), eps)
    }

    // Solve weighted least squares:
    // [ S_w  S_x ] [b0] = [ S_y ]
    // [ S_x S_xx ] [b1]   [ S_xy]
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
      S_y += wi * yi
      S_xy += wi * xi * yi
    }
    const det = S_w * S_xx - S_x * S_x
    if (Math.abs(det) < 1e-18) break // degenerate; keep current b0, b1

    const newB1 = (S_w * S_xy - S_x * S_y) / det
    const newB0 = (S_y - S_x * newB1) / S_w

    const delta = Math.abs(newB0 - b0) + Math.abs(newB1 - b1)
    b0 = newB0
    b1 = newB1
    if (delta < tol) break
  }

  // return slope per index step
  return b1
}

export function calculateFututreEmissionTrend(company: Company) {
  const { reportedPeriods, baseYear } = company
  const hasSufficientData = has3YearsOfReportedData(reportedPeriods)
  if (!hasSufficientData) {
    return {
      futureEmissionTrendSlope: null,
    }
  }

  let calculateTrend = false
  let emissionsType: EmissionsType = 'scope1and2'
  if (baseYear) {
    // Check if company has data reported for base year
    const hasDataForBaseYear = checkDataReportedForBaseYear(
      reportedPeriods,
      baseYear,
    )
    // Check if company has data reported for at least 3 years after base year
    const hasDataReportedFor3YearsAfterBaseYear =
      checkDataReportedFor3YearsAfterBaseYear(reportedPeriods, baseYear)

    // Check if company has scope 3 data for at least 3 years starting from base year
    const hasScope3DataFor3YearsAfterBaseYear =
      checkScope3DataFor3YearsAfterBaseYear(reportedPeriods, baseYear)
    if (hasScope3DataFor3YearsAfterBaseYear) {
      emissionsType = 'scope3'
    }

    // Check if company without scope 3 data has scope 1 and 2 data for at least 3 years starting from base year
    const hasScope1And2DataFor3YearsAfterBaseYear =
      checkOnlyScope1And2DataFor3YearsAfterBaseYear(reportedPeriods, baseYear)

    calculateTrend =
      hasDataForBaseYear &&
      hasDataReportedFor3YearsAfterBaseYear &&
      (hasScope3DataFor3YearsAfterBaseYear ||
        hasScope1And2DataFor3YearsAfterBaseYear)
  } else {
    // Check if company has scope 3 data for at least 3 years
    const hasScope3DataFor3Years = checkScope3DataFor3Years(reportedPeriods)
    if (hasScope3DataFor3Years) {
      emissionsType = 'scope3'
    }

    // Check if company has scope 1 and 2 data for at least 3 years
    const hasScope1And2DataFor3Years =
      checkScope1And2DataFor3Years(reportedPeriods)

    calculateTrend = hasScope3DataFor3Years || hasScope1And2DataFor3Years
  }

  let futureEmissionTrendSlope: number | null = null
  if (calculateTrend) {
    const emissionsArray = extractEmissionsArray(
      reportedPeriods,
      emissionsType,
    ).filter((value): value is number => value !== null)
    futureEmissionTrendSlope = calculateLADTrendSlope(emissionsArray)
  }

  return {
    futureEmissionTrendSlope,
  }
}
