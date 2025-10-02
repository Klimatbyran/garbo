import {
  sumOfExponentialTrendPath,
  sumOfLinearTrendPath,
} from '../src/lib/company-emissions/companyEmissionBudgets'

describe('Company Emission Budgets', () => {
  describe('sumOfTotalFutureTrendEmissions', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    test('should be able to calculate the sum of future emissions path', () => {
      const emissionsSlope = 1
      const lastReportedEmission = 10
      const lastReportedYear = 2023
      const currentYear = 2025

      const result = sumOfLinearTrendPath(
        emissionsSlope,
        lastReportedEmission,
        lastReportedYear,
        currentYear,
      )

      const expectedResult = 637
      expect(result).toEqual(expectedResult)
    })

    test('should be able to calculate the sum of carbon law path', () => {
      const carbonLawSlope = -0.1172
      const lastReportedEmission = 10
      const currentYear = 2025

      const result = sumOfExponentialTrendPath(
        carbonLawSlope,
        lastReportedEmission,
        currentYear,
      )
      const roundedResult = Number(result.toFixed(4))

      const expectedResult = 81.9862
      expect(roundedResult).toEqual(expectedResult)
    })

    test(
      'should be able to calculate when sum of total future trend emissions exceeds sum ' +
        'of total carbon law path (when carbon law path allows for no more emissions, sort of when budget runs out)',
      () => {
        // const result = sumOfTotalFutureTrendEmissionsExceedsTotalCarbonLawPath(1, 2, 3)
        // expect(result).toEqual(4)
      },
    )
  })
})
