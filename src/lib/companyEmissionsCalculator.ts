/**
 * This file contains the functions for emissions calculations for companies.
 */

interface ReportedPeriod {
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
      statedTotalEmissions: number
      categories: {
        category: string
        total: number
      }[]
    }
  }
}

export function hasSufficientEmissionsData(reportedPeriods: ReportedPeriod[]) {
  return reportedPeriods.length > 2
}

export function calculateLADTrendSlope(
  y: number[],
  opts: { maxIter?: number; tol?: number; eps?: number } = {},
): number {
  const n = y.length
  if (n < 2) throw new Error('Need at least two points')

  const maxIter = opts.maxIter ?? 200
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

export function calculateTotalEmissionsArray(
  reportedPeriods: ReportedPeriod[],
) {
  return reportedPeriods.map(
    (period) => period.emissions.calculatedTotalEmissions,
  )
}

export function calculateFututreEmissionTrend(
  reportedPeriods: ReportedPeriod[],
) {
  const calculatedTotalEmissionsArray =
    calculateTotalEmissionsArray(reportedPeriods)

  let futureEmissionTrendSlope: number | null = null

  if (hasSufficientEmissionsData(reportedPeriods)) {
    futureEmissionTrendSlope = calculateLADTrendSlope(
      calculatedTotalEmissionsArray,
    )
  }

  return {
    futureEmissionTrendSlope,
  }
}

export function calculateEmissionTrend(
  currentPeriod: any,
  previousPeriod: any,
) {
  const { adjustedCurrentTotal, adjustedPreviousTotal } =
    calculateEmissionTotals(currentPeriod, previousPeriod)

  // Add null checks for emissions objects
  const currentEmissions = currentPeriod.emissions
  const previousEmissions = previousPeriod.emissions

  if (!currentEmissions || !previousEmissions) {
    return {
      absolute: null,
      adjusted: null,
    }
  }

  return {
    absolute:
      currentEmissions.calculatedTotalEmissions > 0
        ? ((currentEmissions.calculatedTotalEmissions -
            previousEmissions.calculatedTotalEmissions) /
            previousEmissions.calculatedTotalEmissions) *
          100
        : 0,
    adjusted:
      adjustedCurrentTotal > 0
        ? ((adjustedCurrentTotal - adjustedPreviousTotal) /
            adjustedPreviousTotal) *
          100
        : 0,
  }
}

function calculateEmissionTotals(currentPeriod: any, previousPeriod: any) {
  let adjustedCurrentTotal = 0
  let adjustedPreviousTotal = 0

  const {
    scope1: currentScope1,
    scope2: currentScope2,
    scope3: currentScope3,
  } = currentPeriod.emissions || {}
  const {
    scope1: previousScope1,
    scope2: previousScope2,
    scope3: previousScope3,
  } = previousPeriod.emissions || {}

  // Compare Scope 1 emissions
  if (currentScope1 && previousScope1) {
    adjustedCurrentTotal += currentScope1?.total ?? 0
    adjustedPreviousTotal += previousScope1?.total ?? 0
  }

  // Compare Scope 2 emissions
  if (currentScope2 && previousScope2) {
    adjustedCurrentTotal +=
      currentScope2?.mb ?? currentScope2?.lb ?? currentScope2?.unknown ?? 0
    adjustedPreviousTotal +=
      previousScope2?.mb ?? previousScope2?.lb ?? previousScope2?.unknown ?? 0
  }

  // Compare Scope 3 emissions
  if (currentScope3 && previousScope3) {
    calculateScope3EmissionsTotals(
      currentScope3,
      previousScope3,
      (current, previous) => {
        adjustedCurrentTotal += current
        adjustedPreviousTotal += previous
      },
    )
  }

  return { adjustedCurrentTotal, adjustedPreviousTotal }
}

function calculateScope3EmissionsTotals(
  currentScope3: any,
  previousScope3: any,
  addToTotals: (current: number, previous: number) => void,
) {
  const hasCurrentCategories =
    currentScope3?.categories && currentScope3.categories.length > 0
  const hasPreviousCategories =
    previousScope3?.categories && previousScope3.categories.length > 0

  if (hasCurrentCategories && hasPreviousCategories) {
    currentScope3.categories.forEach((currentCategory: any) => {
      const previousCategory = previousScope3.categories.find(
        (category: any) => category.category === currentCategory.category,
      )
      if (previousCategory) {
        addToTotals(currentCategory?.total ?? 0, previousCategory?.total ?? 0)
      }
    })
  } else if (
    currentScope3.statedTotalEmissions &&
    previousScope3.statedTotalEmissions
  ) {
    addToTotals(
      currentScope3?.statedTotalEmissions ?? 0,
      previousScope3?.statedTotalEmissions ?? 0,
    )
  }
}
