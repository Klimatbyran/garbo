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
  // Use separate scope1/scope2 if available, otherwise fall back to combined scope1And2
  // This allows comparing periods where one has separate values and another has combined values
  const currentScope1Total = currentScope1?.total ?? 0
  const currentScope2Total =
    currentScope2?.mb ?? currentScope2?.lb ?? currentScope2?.unknown ?? 0
  const currentSeparateTotal = currentScope1Total + currentScope2Total
  const currentScope1And2Total =
    currentSeparateTotal > 0
      ? currentSeparateTotal
      : (currentScope1And2?.total ?? 0)

  const previousScope1Total = previousScope1?.total ?? 0
  const previousScope2Total =
    previousScope2?.mb ?? previousScope2?.lb ?? previousScope2?.unknown ?? 0
  const previousSeparateTotal = previousScope1Total + previousScope2Total
  const previousScope1And2Total =
    previousSeparateTotal > 0
      ? previousSeparateTotal
      : (previousScope1And2?.total ?? 0)

  // Compare scope 1+2 totals if at least one period has data
  // This allows comparing separate values to combined values (they represent the same thing)
  if (currentScope1And2Total > 0 || previousScope1And2Total > 0) {
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
  const hasCurrentCategories =
    currentScope3?.categories && currentScope3.categories.length > 0
  const hasPreviousCategories =
    previousScope3?.categories && previousScope3.categories.length > 0

  if (hasCurrentCategories && hasPreviousCategories) {
    // Calculate totals from categories (with null safety)
    const currentCategoriesTotal = currentScope3.categories.reduce(
      (total: number, category: any) => (category.total ?? 0) + total,
      0,
    )
    const previousCategoriesTotal = previousScope3.categories.reduce(
      (total: number, category: any) => (category.total ?? 0) + total,
      0,
    )

    // If categories have values, compare category-by-category for matching categories
    if (currentCategoriesTotal > 0 || previousCategoriesTotal > 0) {
      currentScope3.categories.forEach((currentCategory: any) => {
        const previousCategory = previousScope3.categories.find(
          (category: any) => category.category === currentCategory.category,
        )
        if (previousCategory) {
          addToTotals(currentCategory?.total ?? 0, previousCategory?.total ?? 0)
        }
      })
    } else if (
      // If categories exist but sum to zero, fall back to statedTotalEmissions
      currentScope3.statedTotalEmissions &&
      previousScope3.statedTotalEmissions
    ) {
      addToTotals(
        currentScope3.statedTotalEmissions?.total ?? 0,
        previousScope3.statedTotalEmissions?.total ?? 0,
      )
    }
  } else if (
    // If no categories, compare statedTotalEmissions if both have them
    currentScope3.statedTotalEmissions &&
    previousScope3.statedTotalEmissions
  ) {
    addToTotals(
      currentScope3.statedTotalEmissions?.total ?? 0,
      previousScope3.statedTotalEmissions?.total ?? 0,
    )
  }
}
