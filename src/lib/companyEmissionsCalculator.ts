/**
 * This file contains the functions for emissions calculations for companies.
 */

export function calculateFututreEmissionTrend() {
  return
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
