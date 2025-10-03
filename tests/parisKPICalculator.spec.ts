import {
  calculateEmissionAtCurrentYear,
  calculateWhenFutureTrendExceedsCarbonLaw,
  meetsParisGoal,
  sumOfExponentialTrendPath,
  sumOfLinearTrendPath,
} from '../src/lib/parisKPICalculator'

const CARBON_LAW_SLOPE = -0.1172
const LAST_REPORTED_EMISSION = 10
const CURRENT_YEAR = 2025

describe('Paris KPIs Calculator', () => {
  describe('parisKPICalculator', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    test('should calculate the emission at start', () => {
      const linearSlope = -0.5
      const lastReportedYear = 2023

      const result = calculateEmissionAtCurrentYear(
        linearSlope,
        LAST_REPORTED_EMISSION,
        lastReportedYear,
        CURRENT_YEAR,
      )

      const expectedResult = 9
      expect(result).toEqual(expectedResult)
    })

    test('should calculate the sum of future emissions path', () => {
      const emissionsSlope = 1

      const result = sumOfLinearTrendPath(
        emissionsSlope,
        LAST_REPORTED_EMISSION,
        CURRENT_YEAR,
      )

      const expectedResult = 585
      expect(result).toEqual(expectedResult)
    })

    test('should calculate the sum of carbon law path', () => {
      const result = sumOfExponentialTrendPath(
        LAST_REPORTED_EMISSION,
        CURRENT_YEAR,
        CARBON_LAW_SLOPE,
      )
      const roundedResult = Number(result.toFixed(4))
      // 81.97
      expect(roundedResult).toEqual(expectedResult)
    })

    test('should decide if company meets paris agreement', () => {
      const totalTrend = 10
      const totalCarbonLaw = 20

      const result = meetsParisGoal(totalTrend, totalCarbonLaw)

      expect(result).toBe(true)
    })

    test('should decide if company does not meet paris agreement', () => {
      const totalTrend = 20
      const totalCarbonLaw = 10

      const result = meetsParisGoal(totalTrend, totalCarbonLaw)

      expect(result).toBe(false)
    })

    test('should decide if company meets paris agreement when total trend is equal to total carbon law', () => {
      const totalTrend = 20
      const totalCarbonLaw = 20

      const result = meetsParisGoal(totalTrend, totalCarbonLaw)

      expect(result).toBe(true)
    })

    test(
      'should calculate when sum of total future trend emissions exceeds sum ' +
        'of total carbon law path (when carbon law path allows for no more emissions, sort of when budget runs out)',
      () => {
        const linearSlope = -0.5
        const carbonLawSum = 20

        const result = calculateWhenFutureTrendExceedsCarbonLaw(
          linearSlope,
          LAST_REPORTED_EMISSION,
          carbonLawSum,
          CURRENT_YEAR,
        )

        expect(result?.getFullYear()).toBe(2027)
        expect(result?.getMonth()).toBe(1)
        expect(result?.getDate()).toBe(11)
      },
    )

    test('should return same date as for old calculation for municipalities', () => {
      const aleSlope = 782.3341
      const alesLastReportedEmission = 144501.6222
      const aleCurrentYear = 2024
      const alesCarbonLawSum = 286595.3809
      const result = calculateWhenFutureTrendExceedsCarbonLaw(
        aleSlope,
        alesLastReportedEmission,
        alesCarbonLawSum,
        aleCurrentYear,
      )

      expect(result?.getFullYear()).toBe(2025)
      expect(result?.getMonth()).toBe(11)
      expect(result?.getDate()).toBe(21)
    })

    test('should return null if the future trend is same as the carbon law path', () => {
      const linearSlope = -5
      const carbonLawSum = 20

      const result = calculateWhenFutureTrendExceedsCarbonLaw(
        linearSlope,
        LAST_REPORTED_EMISSION,
        carbonLawSum,
        CURRENT_YEAR,
      )

      expect(result).toBeNull()
    })

    test('should return null if the future trend is same as the carbon law path', () => {
      const linearSlope = -10
      const carbonLawSum = 20

      const result = calculateWhenFutureTrendExceedsCarbonLaw(
        linearSlope,
        LAST_REPORTED_EMISSION,
        carbonLawSum,
        CURRENT_YEAR,
      )

      expect(result).toBeNull()
    })
  })
})
