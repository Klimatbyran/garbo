import { Emissions } from '../emissions'

/**
 * Priority: mb > lb > unknown
 * Returns null if no data is available.
 */
export function calculateScope2Total(scope2: any): number | null {
  return scope2?.mb ?? scope2?.lb ?? scope2?.unknown ?? null
}

/**
 * Uses separate scope1/scope2 if available, otherwise falls back to combined scope1And2.
 * Returns null if no data is available.
 */
export function calculateScope1And2Total(
  scope1: any,
  scope2: any,
  scope1And2: any,
): number | null {
  const scope1Total = scope1?.total ?? null
  const scope2Total = calculateScope2Total(scope2)
  const separateTotal =
    scope1Total !== null || scope2Total !== null
      ? (scope1Total ?? 0) + (scope2Total ?? 0)
      : null

  if (separateTotal !== null) {
    return separateTotal
  }

  return scope1And2?.total ?? null
}

/**
 * Returns 0 if categories exist but sum to 0 (0 is valid data).
 * Returns null if no categories exist.
 */
function calculateScope3CategoriesTotal(
  categories: any[] | undefined,
): number | null {
  if (!categories || categories.length === 0) {
    return null
  }
  return categories.reduce(
    (total, category) => (category.total ?? 0) + total,
    0,
  )
}

/**
 * Uses categories if available, otherwise falls back to statedTotalEmissions.
 * Returns null if no data is available.
 */
export function calculateScope3Total(scope3: any): number | null {
  if (!scope3) {
    return null
  }

  const scope3Data = scope3
  const categoriesTotal = calculateScope3CategoriesTotal(scope3Data.categories)

  if (categoriesTotal !== null) {
    return categoriesTotal
  }
  return scope3Data.statedTotalEmissions?.total ?? null
}

/**
 * Calculates total emissions from an Emissions object.
 * Combines scope 1+2 and scope 3 emissions.
 * Returns null if no data is available.
 */
export function calculatedTotalEmissions(emissions: Emissions): number | null {
  const { scope1, scope2, scope3, scope1And2 } = emissions || {}

  const scope1And2Total = calculateScope1And2Total(scope1, scope2, scope1And2)
  const scope3Total = calculateScope3Total(scope3)

  // If both are null, return null (no data available)
  if (scope1And2Total === null && scope3Total === null) {
    return null
  }

  // Otherwise, sum them (treating null as 0 for calculation, but we already handled the all-null case)
  return (scope1And2Total ?? 0) + (scope3Total ?? 0)
}

export function calculateEmissionChangeLastTwoYears(
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

  const currentTotal = currentEmissions.calculatedTotalEmissions
  const previousTotal = previousEmissions.calculatedTotalEmissions

  return {
    absolute:
      currentTotal !== null &&
      previousTotal !== null &&
      currentTotal > 0 &&
      previousTotal > 0
        ? ((currentTotal - previousTotal) / previousTotal) * 100
        : null,
    adjusted:
      adjustedCurrentTotal > 0 && adjustedPreviousTotal > 0
        ? ((adjustedCurrentTotal - adjustedPreviousTotal) /
            adjustedPreviousTotal) *
          100
        : null,
  }
}

/**
 * Calculates "adjusted" emission totals for two periods by only including scopes
 * that exist in BOTH periods. This ensures like-for-like comparisons when calculating
 * percentage changes between periods.
 *
 * This is used for the "adjusted" emissions change calculation, which differs from
 * the "absolute" calculation that uses calculatedTotalEmissions (which includes all
 * available scopes regardless of whether they exist in both periods).
 *
 * Example: If period 1 has scope1+scope2+scope3, but period 2 only has scope1+scope3,
 * the adjusted total will only include scope1+scope3 from both periods.
 */
function calculateEmissionTotals(currentPeriod: any, previousPeriod: any) {
  let adjustedCurrentTotal = 0
  let adjustedPreviousTotal = 0

  const {
    scope1: currentScope1,
    scope2: currentScope2,
    scope3: currentScope3,
    scope1And2: currentScope1And2,
  } = currentPeriod.emissions || {}
  const {
    scope1: previousScope1,
    scope2: previousScope2,
    scope3: previousScope3,
    scope1And2: previousScope1And2,
  } = previousPeriod.emissions || {}

  // Calculate scope 1+2 totals for each period independently
  const currentScope1And2Total = calculateScope1And2Total(
    currentScope1,
    currentScope2,
    currentScope1And2,
  )
  const previousScope1And2Total = calculateScope1And2Total(
    previousScope1,
    previousScope2,
    previousScope1And2,
  )

  // Compare scope 1+2 totals if both periods have data
  // This allows comparing separate values to combined values (they represent the same thing)
  if (currentScope1And2Total !== null && previousScope1And2Total !== null) {
    adjustedCurrentTotal += currentScope1And2Total
    adjustedPreviousTotal += previousScope1And2Total
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

/**
 * Calculates scope 3 emissions totals for comparison between two periods.
 * This function is used for "adjusted" emissions change calculations, which only
 * compare scopes that exist in both periods to ensure like-for-like comparisons.
 *
 * Strategy:
 * 1. If both periods have categories with values, compare category-by-category (only matching categories)
 * 2. If categories exist but sum to zero, fall back to statedTotalEmissions if available
 * 3. If both periods have statedTotalEmissions (and no valid categories), compare those totals
 */
function calculateScope3EmissionsTotals(
  currentScope3: any,
  previousScope3: any,
  addToTotals: (current: number, previous: number) => void,
) {
  function categoriesHaveValues(): boolean {
    const hasCurrentCategories =
      currentScope3?.categories && currentScope3.categories.length > 0
    const hasPreviousCategories =
      previousScope3?.categories && previousScope3.categories.length > 0

    if (!hasCurrentCategories || !hasPreviousCategories) {
      return false
    }

    const currentCategoriesTotal =
      calculateScope3CategoriesTotal(currentScope3.categories) ?? 0
    const previousCategoriesTotal =
      calculateScope3CategoriesTotal(previousScope3.categories) ?? 0

    return currentCategoriesTotal > 0 || previousCategoriesTotal > 0
  }

  function addMatchingCategoriesToSum(): void {
    currentScope3.categories.forEach((currentCategory: any) => {
      const previousCategory = previousScope3.categories.find(
        (category: any) => category.category === currentCategory.category,
      )
      if (previousCategory) {
        addToTotals(currentCategory?.total ?? 0, previousCategory?.total ?? 0)
      }
    })
  }

  function statedTotalsExist(): boolean {
    return (
      !!currentScope3.statedTotalEmissions &&
      !!previousScope3.statedTotalEmissions
    )
  }

  function addStatedTotalsToSum(): void {
    addToTotals(
      currentScope3.statedTotalEmissions?.total ?? 0,
      previousScope3.statedTotalEmissions?.total ?? 0,
    )
  }

  if (categoriesHaveValues()) {
    addMatchingCategoriesToSum()
  } else if (statedTotalsExist()) {
    addStatedTotalsToSum()
  }
}
