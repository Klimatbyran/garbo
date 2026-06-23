import {
  calculateCarbonLawCumulativeEmissions,
  calculateCompanyKpi,
  calculateCumulativeEmissions,
  calculateEmissionsChangeFromBaseYear,
  calculateMeetsParis,
} from '../src/lib/company-emissions/companyKpiCalculator'

const CARBON_LAW_REDUCTION_RATE = 0.1172

describe('companyKpiCalculator', () => {
  describe('calculateCumulativeEmissions', () => {
    it('sums constant emissions when the trend slope is zero', () => {
      expect(calculateCumulativeEmissions(100, 0, 2025, 2027)).toBe(300)
    })

    it('sums declining linear emissions and floors negative years at zero', () => {
      expect(calculateCumulativeEmissions(100, -10, 2025, 2035)).toBe(550)
    })

    it('sums increasing linear emissions across the range', () => {
      expect(calculateCumulativeEmissions(100, 10, 2025, 2027)).toBe(330)
    })
  })

  describe('calculateCarbonLawCumulativeEmissions', () => {
    it('returns the starting emissions for a single-year range', () => {
      expect(calculateCarbonLawCumulativeEmissions(100, 2025, 2025)).toBe(100)
    })

    it('applies the carbon law reduction rate each year', () => {
      const startEmissions = 100
      const expected =
        startEmissions +
        startEmissions * (1 - CARBON_LAW_REDUCTION_RATE) +
        startEmissions * Math.pow(1 - CARBON_LAW_REDUCTION_RATE, 2)

      expect(
        calculateCarbonLawCumulativeEmissions(startEmissions, 2025, 2027)
      ).toBeCloseTo(expected, 5)
    })
  })

  describe('calculateMeetsParis', () => {
    it('returns null when future emissions trend slope is unavailable', () => {
      expect(
        calculateMeetsParis({
          wikidataId: 'Q1',
          name: 'Test Co',
          futureEmissionsTrendSlope: null,
          reportingPeriods: [],
        })
      ).toBeNull()
    })

    it('returns true when estimated 2025 emissions are zero or negative', () => {
      expect(
        calculateMeetsParis({
          wikidataId: 'Q1',
          name: 'Test Co',
          futureEmissionsTrendSlope: -100,
          reportingPeriods: [
            {
              startDate: '2024-01-01',
              endDate: '2024-12-31',
              emissions: { calculatedTotalEmissions: 100 },
            },
            {
              startDate: '2025-01-01',
              endDate: '2025-12-31',
              emissions: { calculatedTotalEmissions: 0 },
            },
          ],
        })
      ).toBe(true)
    })

    it('returns true when cumulative trend emissions stay within the carbon law budget', () => {
      expect(
        calculateMeetsParis({
          wikidataId: 'Q1',
          name: 'Test Co',
          futureEmissionsTrendSlope: -10000,
          reportingPeriods: [
            {
              startDate: '2024-01-01',
              endDate: '2024-12-31',
              emissions: { calculatedTotalEmissions: 100000 },
            },
          ],
        })
      ).toBe(true)
    })

    it('returns false when cumulative trend emissions exceed the carbon law budget', () => {
      expect(
        calculateMeetsParis({
          wikidataId: 'Q1',
          name: 'Test Co',
          futureEmissionsTrendSlope: 5000,
          reportingPeriods: [
            {
              startDate: '2024-01-01',
              endDate: '2024-12-31',
              emissions: { calculatedTotalEmissions: 100000 },
            },
          ],
        })
      ).toBe(false)
    })

    it('compares projected cumulative emissions against the carbon law budget', () => {
      const slope = -10000
      const company = {
        wikidataId: 'Q1',
        name: 'Test Co',
        futureEmissionsTrendSlope: slope,
        reportingPeriods: [
          {
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            emissions: { calculatedTotalEmissions: 100000 },
          },
        ],
      }

      const emissions2025 = 90000
      const companyCumulative = calculateCumulativeEmissions(
        emissions2025,
        slope,
        2025,
        2050
      )
      const carbonLawCumulative = calculateCarbonLawCumulativeEmissions(
        emissions2025,
        2025,
        2050
      )

      expect(companyCumulative).toBeLessThanOrEqual(carbonLawCumulative)
      expect(calculateMeetsParis(company)).toBe(true)
    })

    it('returns false when projected cumulative emissions exceed the carbon law budget', () => {
      const slope = 5000
      const company = {
        wikidataId: 'Q1',
        name: 'Test Co',
        futureEmissionsTrendSlope: slope,
        reportingPeriods: [
          {
            startDate: '2024-01-01',
            endDate: '2024-12-31',
            emissions: { calculatedTotalEmissions: 100000 },
          },
        ],
      }

      const emissions2025 = 105000
      const companyCumulative = calculateCumulativeEmissions(
        emissions2025,
        slope,
        2025,
        2050
      )
      const carbonLawCumulative = calculateCarbonLawCumulativeEmissions(
        emissions2025,
        2025,
        2050
      )

      expect(companyCumulative).toBeGreaterThan(carbonLawCumulative)
      expect(calculateMeetsParis(company)).toBe(false)
    })
  })

  describe('calculateEmissionsChangeFromBaseYear', () => {
    it('returns null when no base year is defined', () => {
      expect(
        calculateEmissionsChangeFromBaseYear({
          wikidataId: 'Q1',
          name: 'Test Co',
          futureEmissionsTrendSlope: null,
          reportingPeriods: [
            {
              startDate: '2024-01-01',
              endDate: '2024-12-31',
              emissions: { calculatedTotalEmissions: 100 },
            },
          ],
        })
      ).toBeNull()
    })

    it('calculates percentage change from base year to latest period with emissions', () => {
      expect(
        calculateEmissionsChangeFromBaseYear({
          wikidataId: 'Q1',
          name: 'Test Co',
          futureEmissionsTrendSlope: null,
          baseYear: { year: 2020 },
          reportingPeriods: [
            {
              startDate: '2019-01-01',
              endDate: '2019-12-31',
              emissions: { calculatedTotalEmissions: 90 },
            },
            {
              startDate: '2020-01-01',
              endDate: '2020-12-31',
              emissions: { calculatedTotalEmissions: 100 },
            },
            {
              startDate: '2024-01-01',
              endDate: '2024-12-31',
              emissions: { calculatedTotalEmissions: 80 },
            },
          ],
        })
      ).toBe(-20)
    })

    it('uses the chronologically latest period when dates are Date objects', () => {
      const baselineEmissions = 145800
      const latestEmissions = 213760

      expect(
        calculateEmissionsChangeFromBaseYear({
          wikidataId: 'Q1',
          name: 'Test Co',
          futureEmissionsTrendSlope: null,
          baseYear: { year: 2019 },
          reportingPeriods: [
            {
              startDate: new Date('2023-01-01T00:00:00.000Z'),
              endDate: new Date('2023-12-31T00:00:00.000Z'),
              emissions: { calculatedTotalEmissions: latestEmissions },
            },
            {
              startDate: new Date('2020-01-01T00:00:00.000Z'),
              endDate: new Date('2020-12-31T00:00:00.000Z'),
              emissions: { calculatedTotalEmissions: 122500 },
            },
            {
              startDate: new Date('2019-01-01T00:00:00.000Z'),
              endDate: new Date('2019-12-31T00:00:00.000Z'),
              emissions: { calculatedTotalEmissions: baselineEmissions },
            },
          ],
        })
      ).toBeCloseTo(
        ((latestEmissions - baselineEmissions) / baselineEmissions) * 100,
        5
      )
    })
  })

  describe('calculateCompanyKpi', () => {
    it('projects company identity and KPI fields', () => {
      expect(
        calculateCompanyKpi({
          wikidataId: 'Q123',
          name: 'Example AB',
          futureEmissionsTrendSlope: -10000,
          baseYear: { year: 2020 },
          reportingPeriods: [
            {
              startDate: '2020-01-01',
              endDate: '2020-12-31',
              emissions: { calculatedTotalEmissions: 100 },
            },
            {
              startDate: '2024-01-01',
              endDate: '2024-12-31',
              emissions: { calculatedTotalEmissions: 80 },
            },
          ],
        })
      ).toEqual({
        wikidataId: 'Q123',
        name: 'Example AB',
        meetsParis: true,
        emissionsChangeFromBaseYear: -20,
      })
    })
  })
})
