import {
  calculateLADTrendSlope,
  extractEmissionsArray,
  has3YearsOfReportedData,
  checkDataReportedForBaseYear,
  checkDataReportedFor3YearsAfterBaseYear,
  checkScope3DataFor3YearsAfterBaseYear,
  checkScope1And2DataFor3Years,
} from '../src/lib/companyEmissionsFutureTrendCalculator'

describe('Company Emissions Calculator', () => {
  describe('calculateFututreEmissionTrend', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    const reportedPeriods = [
      {
        year: 1,
        emissions: {
          calculatedTotalEmissions: 7,
          scope3: {
            categories: [
              {
                category: 1,
                total: 6,
              },
            ],
          },
        },
      },
      {
        year: 2,
        emissions: {
          calculatedTotalEmissions: 14,
          scope1: {
            total: 1,
          },
          scope2: {
            mb: 1,
            lb: 1,
            unknown: 0,
          },
          scope3: {
            categories: [
              {
                category: 1,
                total: 12,
              },
            ],
          },
        },
      },
      {
        year: 3,
        emissions: {
          calculatedTotalEmissions: 10,
          scope1: {
            total: 1,
          },
          scope2: {
            mb: 1,
            lb: 1,
            unknown: 0,
          },
          scope3: {
            categories: [
              {
                category: 1,
                total: 8,
              },
            ],
          },
        },
      },
      {
        year: 4,
        emissions: {
          calculatedTotalEmissions: 17,
          scope1: {
            total: 2,
          },
          scope2: {
            mb: 1,
            lb: 1,
            unknown: 0,
          },
          scope3: {
            categories: [
              {
                category: 1,
                total: 14,
              },
            ],
          },
        },
      },
      {
        year: 5,
        emissions: {
          calculatedTotalEmissions: 15,
          scope1: {
            total: 2,
          },
          scope2: {
            mb: 1,
            lb: 1,
            unknown: 0,
          },
          scope3: {
            categories: [
              {
                category: 1,
                total: 12,
              },
            ],
          },
        },
      },
      {
        year: 6,
        emissions: {
          calculatedTotalEmissions: 21,
          scope1: {
            total: 1,
          },
          scope2: {
            mb: 2,
            lb: 2,
            unknown: 0,
          },
          scope3: {
            categories: [
              {
                category: 1,
                total: 18,
              },
            ],
          },
        },
      },
      {
        year: 7,
        emissions: {
          calculatedTotalEmissions: 26,
        },
      },
      {
        year: 8,
        emissions: {
          calculatedTotalEmissions: 23,
        },
      },
    ]

    const calculatedTotalEmissionsArray = [7, 14, 10, 17, 15, 21, 26, 23]

    test('should return true if there is sufficient emissions data', () => {
      // More than 2 reported periods with emissions should be flagged true

      const result = has3YearsOfReportedData(reportedPeriods)
      expect(result).toEqual(true)
    })

    test('should return false if there is not sufficient emissions data', () => {
      // Less than 2 reported periods with emissions should be flagged false

      const result = has3YearsOfReportedData(reportedPeriods.slice(0, 2))
      expect(result).toEqual(false)
    })

    test('should return true if there is data reported for base year', () => {
      const result = checkDataReportedForBaseYear(reportedPeriods, 2)
      expect(result).toEqual(true)
    })

    test('should return false if there is no data reported for base year', () => {
      const result = checkDataReportedForBaseYear(reportedPeriods, 9)
      expect(result).toEqual(false)
    })

    test('should return true if there is data reported for at least 3 years after base year', () => {
      const result = checkDataReportedFor3YearsAfterBaseYear(reportedPeriods, 2)
      expect(result).toEqual(true)
    })

    test('should return false if the company has less than 3 years of data starting from base year', () => {
      const result = checkDataReportedFor3YearsAfterBaseYear(reportedPeriods, 7)
      expect(result).toEqual(false)
    })

    test('should return true if there is scope 3 data for at least 3 years starting from base year', () => {
      const result = checkScope3DataFor3YearsAfterBaseYear(reportedPeriods, 2)
      expect(result).toEqual(true)
    })

    test('should return false if the company has less than 3 years of scope 3 data starting from base year', () => {
      const result = checkScope3DataFor3YearsAfterBaseYear(reportedPeriods, 6)
      expect(result).toEqual(false)
    })

    test('should return true if there is scope 1 and 2 data for at least 3 years', () => {
      const result = checkScope1And2DataFor3Years(reportedPeriods)
      expect(result).toEqual(true)
    })

    test('should return false if the company has less than 3 years of scope 1 and 2 data', () => {
      const result = checkScope1And2DataFor3Years(reportedPeriods.slice(6, 8))
      expect(result).toEqual(false)
    })

    test('should return expected result for total emissions array', () => {
      const result = extractEmissionsArray(
        reportedPeriods,
        'calculatedTotalEmissions',
      )
      console.log('result', result)
      expect(result).toEqual(calculatedTotalEmissionsArray)
    })

    test('should return expected result for LAD slope per index step', () => {
      // Test for LAD slope per index step
      const result = calculateLADTrendSlope(calculatedTotalEmissionsArray)

      const expectedResult = 2.8
      const roundedResult = Number(result.toFixed(2))
      expect(roundedResult).toEqual(expectedResult)
    })

    /*
    test('should only use data after base year, if base year is provided', () => {

    test('if scope 3 data is available for some year, only calculate trend if there is at least 3 valid years of scope 3 data', () => {

    test('if there's no scope 3 data, use calculated total emissions to calculate trend', () => {

    test('company with base year and scope 3 data for 3 years should calculate trend using data after base year (that has scope 3 data)', () => {
    
    test('should handle null or missing data', () => {
      const result = calculateFututreEmissionTrend(null);
      
      expect(result).toEqual({
        // Expected output for null input
      });
    });
    */
  })
})
