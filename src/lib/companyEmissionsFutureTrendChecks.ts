import {
  has3YearsOfNonNullData,
  ReportedPeriod,
} from './companyEmissionsFutureTrendCalculator'

export function checkDataReportedForBaseYear(
  reportedPeriods: ReportedPeriod[],
  baseYear: number,
) {
  return reportedPeriods.some((period) => period.year === baseYear)
}

export function checkForNulls(emission: number | null | undefined) {
  return emission !== null && emission !== undefined
}

export function checkForScope3Data(period: ReportedPeriod) {
  if (!period.emissions) return false

  return (
    (checkForNulls(period.emissions.scope3?.statedTotalEmissions?.total) &&
      period.emissions.scope3?.statedTotalEmissions?.total > 0) ||
    (period.emissions.scope3?.categories &&
      period.emissions.scope3.categories.some(
        (category) => checkForNulls(category.total) && category.total! > 0,
      ))
  )
}

export function checkDataReportedFor3YearsAfterBaseYear(
  reportedPeriods: ReportedPeriod[],
  baseYear: number,
) {
  const periodsAfterBaseYear = filterFromBaseYear(reportedPeriods, baseYear)
  return periodsAfterBaseYear.length >= 3
}

export function filterFromBaseYear(
  reportedPeriods: ReportedPeriod[],
  baseYear: number,
) {
  return reportedPeriods.filter((period) => period.year >= baseYear)
}

export function checkScope3DataFor3YearsAfterBaseYear(
  reportedPeriods: ReportedPeriod[],
  baseYear: number,
) {
  const periodsAfterBaseYear = filterFromBaseYear(reportedPeriods, baseYear)
  return has3YearsOfNonNullData(periodsAfterBaseYear, 'scope3')
}

export function checkOnlyScope1And2DataFor3YearsAfterBaseYear(
  reportedPeriods: ReportedPeriod[],
  baseYear: number,
) {
  const periodsAfterBaseYear = filterFromBaseYear(reportedPeriods, baseYear)
  return (
    periodsAfterBaseYear.every((period) => {
      if (!period.emissions || !period.emissions.scope3) return true

      const hasCalculatedEmissions =
        period.emissions.scope3.calculatedTotalEmissions &&
        period.emissions.scope3.calculatedTotalEmissions > 0

      const hasStatedTotal =
        period.emissions.scope3.statedTotalEmissions?.total &&
        period.emissions.scope3.statedTotalEmissions.total > 0

      const hasCategories =
        period.emissions.scope3.categories &&
        period.emissions.scope3.categories.some(
          (cat) => cat.total && cat.total > 0,
        )

      return !(hasCalculatedEmissions || hasStatedTotal || hasCategories)
    }) && has3YearsOfNonNullData(periodsAfterBaseYear, 'scope1and2')
  )
}

export function checkScope3DataFor3Years(reportedPeriods: ReportedPeriod[]) {
  return has3YearsOfNonNullData(reportedPeriods, 'scope3')
}

export function checkScope1And2DataFor3Years(
  reportedPeriods: ReportedPeriod[],
) {
  return has3YearsOfNonNullData(reportedPeriods, 'scope1and2')
}
