import {
  calculateLADTrendSlope,
  extractEmissionsArray,
  extractScope1And2EmissionsArray,
  extractScope3EmissionsArray,
  has3YearsOfNonNullData,
  has3YearsOfReportedData,
} from '../src/lib/companyEmissionsFutureTrendCalculator'
import {
  checkDataReportedForBaseYear,
  checkDataReportedFor3YearsAfterBaseYear,
  checkScope3DataFor3YearsAfterBaseYear,
  checkScope1And2DataFor3Years,
  checkOnlyScope1And2DataFor3YearsAfterBaseYear,
  checkScope3DataFor3Years,
  checkForNulls,
  filterFromBaseYear,
  checkForScope3Data,
} from '../src/lib/companyEmissionsFutureTrendChecks'
import {
  reportedPeriods,
  reportingPeriodsWithMixedScopeData,
  scope3EmissionsArray,
  scope1And2EmissionsArray,
  scope1and2TotalEmissionsArray,
  aleEmissionSlope,
  aleEmissionsArray,
} from './companyEmissionsCalculatorTestData'

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

    // test checkDataReportedForBaseYear
    test('should return true if there is data reported for base year', () => {
      const result = checkDataReportedForBaseYear(reportedPeriods, 2)
      expect(result).toEqual(true)
    })

    test('should return false if there is no data reported for base year', () => {
      const result = checkDataReportedForBaseYear(reportedPeriods, 9)
      expect(result).toEqual(false)
    })

    // test checkForNulls
    test('should return true if there is no null or undefined value', () => {
      const result = checkForNulls(1)
      expect(result).toEqual(true)
    })

    test('should return false if there is a null or undefined value', () => {
      const result = checkForNulls(null)
      expect(result).toEqual(false)
    })

    // test checkDataReportedFor3YearsAfterBaseYear
    test('should return true if there is data reported for at least 3 years after base year', () => {
      const result = checkDataReportedFor3YearsAfterBaseYear(reportedPeriods, 2)
      expect(result).toEqual(true)
    })

    test('should return false if the company has less than 3 years of data starting from base year', () => {
      const result = checkDataReportedFor3YearsAfterBaseYear(reportedPeriods, 7)
      expect(result).toEqual(false)
    })

    // test filterFromBaseYear
    test('should return the correct periods after base year', () => {
      const result = filterFromBaseYear(reportedPeriods, 2)
      expect(result).toEqual(reportedPeriods.slice(1))
    })

    // test checkScope3DataFor3YearsAfterBaseYear
    test('should return true if there is scope 3 data for at least 3 years starting from base year', () => {
      const result = checkScope3DataFor3YearsAfterBaseYear(reportedPeriods, 2)
      expect(result).toEqual(true)
    })

    test('should return false if the company has less than 3 years of scope 3 data starting from base year', () => {
      const result = checkScope3DataFor3YearsAfterBaseYear(reportedPeriods, 6)
      expect(result).toEqual(false)
    })

    // test checkOnlyScope1And2DataFor3YearsAfterBaseYear
    test('should return true if there is only scope 1 and 2 data for at least 3 years starting from base year', () => {
      const result = checkOnlyScope1And2DataFor3YearsAfterBaseYear(
        reportingPeriodsWithMixedScopeData.slice(1, 4),
        2,
      )
      expect(result).toEqual(true)
    })

    test('should return false if the company has both scope 3 and scope 1 and 2 data starting from base year, but less than 3 years of scope 3 data', () => {
      const result = checkOnlyScope1And2DataFor3YearsAfterBaseYear(
        reportingPeriodsWithMixedScopeData,
        1,
      )
      expect(result).toEqual(false)
    })

    // test checkScope3DataFor3Years
    test('should return true if there is scope 3 data for at least 3 years', () => {
      const result = checkScope3DataFor3Years(reportedPeriods)
      expect(result).toEqual(true)
    })

    test('should return false if the company has less than 3 years of scope 3 data', () => {
      const result = checkScope3DataFor3Years(
        reportingPeriodsWithMixedScopeData,
      )
      expect(result).toEqual(false)
    })

    // test checkScope1And2DataFor3Years
    test('should return true if there is scope 1 and 2 data for at least 3 years', () => {
      const result = checkScope1And2DataFor3Years(reportedPeriods)
      expect(result).toEqual(true)
    })

    test('should return false if the company has less than 3 years of scope 1 and 2 data', () => {
      const result = checkScope1And2DataFor3Years(reportedPeriods.slice(6, 8))
      expect(result).toEqual(false)
    })

    // test extractEmissionsArray
    test('should return expected result for total emissions array', () => {
      const result = extractEmissionsArray(reportedPeriods, 'scope1and2')
      expect(result).toEqual(scope1and2TotalEmissionsArray)
    })

    // test checkForScope3Data
    test('should return true if there is scope 3 data for a period', () => {
      const result = checkForScope3Data(reportedPeriods[0])
      expect(result).toEqual(true)
    })

    test('should return false if there is no scope 3 data for a period', () => {
      const result = checkForScope3Data(reportedPeriods[6])
      expect(result).toEqual(false)
    })

    // test extractScope3EmissionsArray
    test('should return expected result for scope 3 emissions array', () => {
      const result = extractScope3EmissionsArray(reportedPeriods)
      console.log('result', result)
      console.log('scope3EmissionsArray', scope3EmissionsArray)
      expect(result).toEqual(scope3EmissionsArray)
    })

    // test extractScope1And2EmissionsArray
    test('should return expected result for scope 1 and 2 emissions array', () => {
      const result = extractScope1And2EmissionsArray(
        reportingPeriodsWithMixedScopeData.slice(1, 4),
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

    // todo test calculateFututreEmissionTrend for different scenarios
  })
})
