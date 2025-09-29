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
        'scope1and2',
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
        'scope3',
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

    // test extractEmissionsArray
    test('should return expected result for scope 3 emissions array', () => {
      const result = extractEmissionsArray(reportedPeriods, 'scope3')

      expect(result).toEqual(scope3EmissionsArray)
    })

    test('should return expected result for scope 1 and 2 emissions array', () => {
      const result = extractEmissionsArray(
        reportingPeriodsWithMixedScopeData.slice(1, 4),
        'scope1and2',
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
        reportingPeriodsWithMixedScopeData.slice(1),
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
  })
})
