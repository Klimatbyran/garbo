import { ReportedPeriod } from '../src/lib/companyEmissionsFutureTrendCalculator'
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
  sveviaEmissions,
  sveviaLastPeriod,
  companyWithoutScope3Data,
  hanzaPeriod,
} from './companyEmissionsFutureTrendCalculatorTestData'

describe('Company Emissions Future Trend Checks', () => {
  describe('calculateFutureEmissionTrendChecks', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    afterEach(() => {
      jest.restoreAllMocks()
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

    // test checkForScope3Data
    test('should return true if there is scope 3 data for a period', () => {
      const result = checkForScope3Data(sveviaEmissions[0])
      expect(result).toEqual(true)
    })

    test('should return false if there is no scope 3 data for a period', () => {
      const result = checkForScope3Data(sveviaLastPeriod)
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

    test('should return true if the company has only scope 1 and 2 data for at least 3 years starting from base year', () => {
      const result = checkOnlyScope1And2DataFor3YearsAfterBaseYear(
        companyWithoutScope3Data,
        2,
      )
      expect(result).toEqual(true)
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

    // test checkForScope3Data
    test('should return true if there is scope 3 data for a period', () => {
      const result = checkForScope3Data(reportedPeriods[0])
      expect(result).toEqual(true)
    })

    test('should return false if there is no scope 3 data for a period', () => {
      const result = checkForScope3Data(sveviaLastPeriod)
      expect(result).toEqual(false)
    })

    test('should return false for Hanza with no scope 3 data', () => {
      const result = checkForScope3Data(hanzaPeriod)
      expect(result).toEqual(false)
    })
  })
})
