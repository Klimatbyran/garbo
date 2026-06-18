import {
  calculateCompanyKpi,
  calculateEmissionsChangeFromBaseYear,
  calculateMeetsParis,
} from '../src/lib/company-emissions/companyKpiCalculator'

describe('companyKpiCalculator', () => {
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
