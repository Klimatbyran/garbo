import { jest } from '@jest/globals'
import {
  calculateLADTrendSlope,
  extractEmissionsArray,
  has3YearsOfNonNullData,
  calculateFutureEmissionTrend,
  hasValidValue,
  hasScope3Data,
  hasScope1And2Data,
  getPeriodsFromBaseYear,
  getValidDataPeriods,
  determineEmissionsType,
  ReportedPeriod,
} from '../src/lib/company-emissions/companyEmissionsFutureTrendCalculator'
import {
  reportedPeriods,
  reportingPeriodsWithMixedScopeData,
  scope3EmissionsArray,
  scope1And2EmissionsArray,
  scope1and2TotalEmissionsArray,
  aleEmissionSlope,
  aleEmissionsArray,
  sveviaEmissions,
  sveviaEmissionsArray,
  sveviaEmissionSlope,
  sveviaEmissionsWithNull,
  kirunaEmissionsArray,
  kirunaEmissionSlope,
  reportedPeriodWithScope3Data,
  reportedPeriodWithoutScope3Data,
  reportingPeriodWithoutScope1And2Data,
  zeroEmissionsData,
  identicalEmissionsData,
  extremeOutlierData,
  nanEmissionsData,
  insufficientDataAfterBaseYear,
  baseYearNotFoundData,
  scope3OnlyStatedTotalData,
  scope3EmptyCategoriesData,
  scope2OnlyUnknownData,
  scope1ZeroData,
  baseYearTestData,
} from './companyEmissionsFutureTrendCalculatorTestData'

describe('Company Emissions Calculator', () => {
  describe('calculateFutureEmissionTrend', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    // test hasValidValue
    test('should return true if the value is not null or undefined', () => {
      const result = hasValidValue(1)
      expect(result).toEqual(true)
    })

    test('should return false if the value is null', () => {
      const result = hasValidValue(null)
      expect(result).toEqual(false)
    })

    test('should return false if the value is undefined', () => {
      const result = hasValidValue(undefined)
      expect(result).toEqual(false)
    })

    // test hasScope3Data
    test('should return true if the period has scope 3 data', () => {
      const result = hasScope3Data(reportedPeriodWithScope3Data)
      expect(result).toEqual(true)
    })

    test('should return false if the period does not have scope 3 data', () => {
      const result = hasScope3Data(reportedPeriodWithoutScope3Data)
      expect(result).toEqual(false)
    })

    // test hasScope1And2Data
    test('should return true if the period has scope 1 and 2 data', () => {
      const result = hasScope1And2Data(reportingPeriodsWithMixedScopeData[1])
      expect(result).toEqual(true)
    })

    test('should return false if the period does not have scope 1 and 2 data', () => {
      const result = hasScope1And2Data(reportingPeriodWithoutScope1And2Data)
      expect(result).toEqual(false)
    })

    // test getPeriodsFromBaseYear
    test('should return expected result for getPeriodsFromBaseYear', () => {
      const result = getPeriodsFromBaseYear(reportedPeriods, 2)
      expect(result).toEqual(reportedPeriods.slice(1))
    })

    test('should return expected result for getPeriodsFromBaseYear without base year', () => {
      const result = getPeriodsFromBaseYear(reportedPeriods)
      expect(result).toEqual(reportedPeriods)
    })

    // test getValidDataPeriods
    test('should return expected result for getValidDataPeriods', () => {
      const result = getValidDataPeriods(reportedPeriods, 'scope3')
      expect(result).toEqual(reportedPeriods.slice(0, 6))
    })

    test('should return expected result for getValidDataPeriods with scope 1 and 2', () => {
      const result = getValidDataPeriods(
        reportingPeriodsWithMixedScopeData,
        'scope1and2'
      )
      expect(result).toEqual([])
    })

    // test has3YearsOfNonNullData
    test('should return true if there is at least 3 years of non null data', () => {
      const result = has3YearsOfNonNullData(reportedPeriods, 'scope3')
      expect(result).toEqual(true)
    })

    test('should return false if there is less than 3 years of non null data', () => {
      const result = has3YearsOfNonNullData(
        reportedPeriods.slice(6, 9),
        'scope3'
      )
      expect(result).toEqual(false)
    })

    // test extractEmissionsArray
    test('should return expected result for total emissions array', () => {
      const result = extractEmissionsArray(reportedPeriods, 'scope1and2')
      expect(result).toEqual(scope1and2TotalEmissionsArray)
    })

    test('should return expected result for total emissions array with base year', () => {
      const result = extractEmissionsArray(reportedPeriods, 'scope1and2', 2)
      expect(result).toEqual(scope1and2TotalEmissionsArray.slice(1))
    })

    // test extractScope3EmissionsArray
    test('should return expected result for scope 3 emissions array', () => {
      const result = extractEmissionsArray(reportedPeriods, 'scope3')
      expect(result).toEqual(scope3EmissionsArray)
    })

    test('should return expected result for scope 3 emissions array with base year', () => {
      const result = extractEmissionsArray(reportedPeriods, 'scope3', 2)
      expect(result).toEqual(scope3EmissionsArray.slice(1))
    })

    test('should return expected result for scope 1 and 2 emissions array', () => {
      const result = extractEmissionsArray(
        reportingPeriodsWithMixedScopeData.slice(1, 4),
        'scope1and2'
      )
      expect(result).toEqual(scope1And2EmissionsArray)
    })

    // Test for LAD slope
    test('should return expected result for LAD slope', () => {
      const result = calculateLADTrendSlope(scope1and2TotalEmissionsArray)

      const expectedResult = 2.8
      const roundedResult = Number(result.toFixed(2))
      expect(roundedResult).toEqual(expectedResult)
    })

    test('should return expected result for LAD slope for ale to ensure model performs same as for municipalities', () => {
      const result = calculateLADTrendSlope(aleEmissionsArray)
      const roundedResult = Number(result.toFixed(2)) // we're OK with 2 decimal accuracy since we use an approximation of LAD
      expect(roundedResult).toEqual(aleEmissionSlope)
    })

    test('should return expected result for LAD slope for kiruna to ensure model performs same as for municipalities', () => {
      const result = calculateLADTrendSlope(kirunaEmissionsArray)
      const roundedResult = Number(result.toFixed(2)) // same accuracy as for Ale here, since we use an approximation of LAD
      expect(roundedResult).toEqual(kirunaEmissionSlope)
    })

    test('should return expected result for LAD slope step for svevia', () => {
      const result = calculateLADTrendSlope(sveviaEmissionsArray)
      const roundedResult = Number(result.toFixed(4))
      expect(roundedResult).toEqual(sveviaEmissionSlope)
    })

    // test determineEmissionsType
    test('should return expected result for determineEmissionsType', () => {
      const result = determineEmissionsType(reportedPeriods)
      expect(result).toEqual('scope3')
    })

    test('should return expected result for determineEmissionsType with scope 1 and 2', () => {
      const result = determineEmissionsType(
        reportingPeriodsWithMixedScopeData.slice(1)
      )
      expect(result).toEqual('scope1and2')
    })

    test('should return null for determineEmissionsType with less than 3 years of data', () => {
      const result = determineEmissionsType(reportedPeriods.slice(0, 2))
      expect(result).toEqual(null)
    })

    // test calculateFutureEmissionTrend
    test('should return expected result for calculateFutureEmissionTrend', () => {
      const result = calculateFutureEmissionTrend(sveviaEmissions)

      // should use total calculated emissions 2020-2024
      const roundedResult = Number(result?.toFixed(4))
      expect(roundedResult).toEqual(sveviaEmissionSlope)
    })

    test('should handle null emissions for one of the years in sveviaEmissions', () => {
      const result = calculateFutureEmissionTrend(sveviaEmissionsWithNull)

      expect(result).not.toBeNull()
      expect(typeof result).toBe('number')
    })

    // ===== EDGE CASE TESTS =====

    // Base year edge cases
    test('should return null when base year does not exist in data', () => {
      const baseYearNotFoundPeriods: ReportedPeriod[] =
        baseYearNotFoundData.map((item) => ({
          year: item.year,
          emissions: {
            calculatedTotalEmissions: item.emissions,
            scope1: { total: item.emissions / 2 },
            scope2: { mb: item.emissions / 2, lb: 0, unknown: null },
          },
        }))
      const result = determineEmissionsType(baseYearNotFoundPeriods, 2025)
      expect(result).toEqual(null)
    })

    test('should return null when base year filtering leaves insufficient data', () => {
      const insufficientDataPeriods: ReportedPeriod[] =
        insufficientDataAfterBaseYear.map((item) => ({
          year: item.year,
          emissions: {
            calculatedTotalEmissions: item.emissions,
            scope1: { total: item.emissions / 2 },
            scope2: { mb: item.emissions / 2, lb: 0, unknown: null },
          },
        }))
      const result = calculateFutureEmissionTrend(insufficientDataPeriods, 2023)
      expect(result).toEqual(null)
    })

    test('should work correctly with base year filtering', () => {
      const result = calculateFutureEmissionTrend(baseYearTestData, 2020)
      expect(result).not.toBeNull()
      expect(typeof result).toBe('number')
    })

    // LAD algorithm edge cases
    test('should handle all identical emissions values', () => {
      const result = calculateLADTrendSlope(identicalEmissionsData)
      expect(result).toEqual(0)
    })

    test('should handle zero emissions values', () => {
      const result = calculateLADTrendSlope(zeroEmissionsData)
      expect(result).toEqual(0)
    })

    test('should handle extreme outliers in LAD calculation', () => {
      const result = calculateLADTrendSlope(extremeOutlierData)
      // LAD should still produce a valid result even with extreme outliers
      // The exact value may vary, but it should be a valid number
      expect(typeof result).toBe('number')
      expect(!isNaN(result)).toBe(true)
      // The result should be a reasonable magnitude (not infinite)
      expect(Math.abs(result)).toBeLessThan(1000000)
    })

    test('should handle NaN values in emissions data', () => {
      const result = calculateLADTrendSlope(nanEmissionsData)
      expect(isNaN(result)).toBe(true)
    })

    // Data validation edge cases
    test('should handle hasValidValue with NaN', () => {
      expect(hasValidValue(NaN)).toBe(false)
    })

    test('should handle hasValidValue with zero', () => {
      expect(hasValidValue(0)).toBe(true)
    })

    // Scope validation edge cases
    test('should handle scope 3 with only statedTotalEmissions', () => {
      const result = hasScope3Data(scope3OnlyStatedTotalData)
      expect(result).toBe(true)
    })

    test('should handle scope 3 with empty categories and null statedTotal', () => {
      const result = hasScope3Data(scope3EmptyCategoriesData)
      expect(result).toBe(false)
    })

    test('should handle scope 2 with only unknown values', () => {
      const result = hasScope1And2Data(scope2OnlyUnknownData)
      expect(result).toBe(true)
    })

    test('should handle scope 1 with zero values', () => {
      const result = hasScope1And2Data(scope1ZeroData)
      expect(result).toBe(true)
    })

    // Boundary condition tests
    test('should return null with exactly 2 years of data', () => {
      const twoYearsData = reportedPeriods.slice(0, 2)
      const result = calculateFutureEmissionTrend(twoYearsData)
      expect(result).toEqual(null)
    })

    test('should work with exactly 3 years of data', () => {
      const threeYearsData = reportedPeriods.slice(0, 3)
      const result = calculateFutureEmissionTrend(threeYearsData)
      expect(result).not.toBeNull()
      expect(typeof result).toBe('number')
    })

    // Mixed scope data edge cases
    test('should return null when mixed scope data has insufficient years for either type', () => {
      const mixedData: ReportedPeriod[] = [
        {
          year: 2020,
          emissions: {
            calculatedTotalEmissions: 100,
            scope1: { total: 50 },
            scope2: { mb: 50, lb: 0, unknown: null },
          },
        },
        {
          year: 2021,
          emissions: {
            calculatedTotalEmissions: 120,
            scope3: {
              statedTotalEmissions: { total: 120 },
              categories: [],
            },
          },
        },
      ]
      const result = calculateFutureEmissionTrend(mixedData)
      expect(result).toEqual(null)
    })

    // LAD convergence edge cases
    test('should handle LAD convergence with very small values', () => {
      const smallValuesData = [
        { year: 2020, emissions: 0.001 },
        { year: 2021, emissions: 0.002 },
        { year: 2022, emissions: 0.003 },
        { year: 2023, emissions: 0.004 },
      ]
      const result = calculateLADTrendSlope(smallValuesData)
      expect(typeof result).toBe('number')
      expect(!isNaN(result)).toBe(true)
    })

    test('should handle LAD convergence with very large values', () => {
      const largeValuesData = [
        { year: 2020, emissions: 1000000 },
        { year: 2021, emissions: 1000100 },
        { year: 2022, emissions: 1000200 },
        { year: 2023, emissions: 1000300 },
      ]
      const result = calculateLADTrendSlope(largeValuesData)
      expect(typeof result).toBe('number')
      expect(!isNaN(result)).toBe(true)
    })
  })
})
