import {
  calculateLADTrendSlope,
  calculateFututreEmissionTrend,
  hasSufficientEmissionsData,
  calculateTotalEmissionsArray,
} from '../src/lib/companyEmissionsCalculator'

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
        },
      },
      {
        year: 2,
        emissions: {
          calculatedTotalEmissions: 14,
        },
      },
      {
        year: 3,
        emissions: {
          calculatedTotalEmissions: 10,
        },
      },
      {
        year: 4,
        emissions: {
          calculatedTotalEmissions: 17,
        },
      },
      {
        year: 5,
        emissions: {
          calculatedTotalEmissions: 15,
        },
      },
      {
        year: 6,
        emissions: {
          calculatedTotalEmissions: 21,
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

    const companyWithBaseYear = {
      ...reportedPeriods,
      baseYear: 2,
    }

    const calculatedTotalEmissionsArray = [7, 14, 10, 17, 15, 21, 26, 23]

    test('should return expected result for total emissions array', () => {
      const result = calculateTotalEmissionsArray(reportedPeriods)
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

    test('should return true if there is sufficient emissions data', () => {
      // More than 2 reported periods with emissions should be flagged true

      const result = hasSufficientEmissionsData(reportedPeriods)
      expect(result).toEqual(true)
    })

    test('should return false if there is not sufficient emissions data', () => {
      // Less than 2 reported periods with emissions should be flagged false

      const result = hasSufficientEmissionsData(reportedPeriods.slice(0, 2))
      expect(result).toEqual(false)
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
