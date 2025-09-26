import {
  calculateLADTrendSlope,
  extractEmissionsArray,
  extractScope1And2EmissionsArray,
  extractScope3EmissionsArray,
  has3YearsOfNonNullData,
  has3YearsOfReportedData,
  calculateFututreEmissionTrend,
} from '../src/lib/companyEmissionsFutureTrendCalculator'
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
} from './companyEmissionsFutureTrendCalculatorTestData'

describe('Company Emissions Calculator', () => {
  describe('calculateFututreEmissionTrend', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    // test has3YearsOfReportedData
    test('should return true if there is sufficient emissions data', () => {
      const result = has3YearsOfReportedData(reportedPeriods)
      expect(result).toEqual(true)
    })

    test('should return false if there is not sufficient emissions data', () => {
      const result = has3YearsOfReportedData(reportedPeriods.slice(0, 2))
      expect(result).toEqual(false)
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
      const result = extractScope3EmissionsArray(reportedPeriods)
      expect(result).toEqual(scope3EmissionsArray)
    })

    test('should return expected result for scope 3 emissions array with base year', () => {
      const result = extractScope3EmissionsArray(reportedPeriods, 2)
      expect(result).toEqual(scope3EmissionsArray.slice(1))
    })

    // test extractScope1And2EmissionsArray
    test('should return expected result for scope 1 and 2 emissions array', () => {
      const result = extractScope1And2EmissionsArray(
        reportingPeriodsWithMixedScopeData.slice(1, 4),
      )
      expect(result).toEqual(scope1And2EmissionsArray)
    })

    test('should return expected result for scope 1 and 2 emissions array with base year', () => {
      const result = extractScope1And2EmissionsArray(
        reportingPeriodsWithMixedScopeData.slice(1),
        2,
      )
      expect(result).toEqual(scope1And2EmissionsArray)
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

    // Test for LAD slope per index step
    test('should return expected result for LAD slope per index step', () => {
      const result = calculateLADTrendSlope(scope1and2TotalEmissionsArray)

      const expectedResult = 2.8
      const roundedResult = Number(result.toFixed(2))
      expect(roundedResult).toEqual(expectedResult)
    })

    test('should return expected result for LAD slope per index step for ale to ensure model performs same as for municipalities', () => {
      const result = calculateLADTrendSlope(aleEmissionsArray)
      const roundedResult = Number(result.toFixed(4))
      expect(roundedResult).toEqual(aleEmissionSlope)
    })

    test('should return expected result for LAD slope per index step for svevia', () => {
      const result = calculateLADTrendSlope(sveviaEmissionsArray)
      const roundedResult = Number(result.toFixed(4))
      expect(roundedResult).toEqual(sveviaEmissionSlope)
    })

    // test calculateFututreEmissionTrend
    test('should return expected result for calculateFututreEmissionTrend', () => {
      const result = calculateFututreEmissionTrend({
        reportedPeriods: sveviaEmissions,
      })

      // should use total calculated emissions 2020-2024
      const roundedResult = Number(result.futureEmissionTrendSlope?.toFixed(4))
      expect(roundedResult).toEqual(sveviaEmissionSlope)
    })
  })
})
