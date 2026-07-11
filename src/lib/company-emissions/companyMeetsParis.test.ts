import {
  calculateCompanyMeetsParis,
  toCompanyParisOverviewItem,
} from './companyMeetsParis'

describe('calculateCompanyMeetsParis', () => {
  it('returns null when trend slope is unavailable', () => {
    expect(
      calculateCompanyMeetsParis({
        reportingPeriods: [
          {
            endDate: '2024-12-31',
            emissions: { calculatedTotalEmissions: 1000 },
          },
        ],
        futureEmissionsTrendSlope: null,
      })
    ).toBeNull()
  })

  it('returns true when 2025 emissions are zero', () => {
    expect(
      calculateCompanyMeetsParis({
        reportingPeriods: [
          {
            endDate: '2025-12-31',
            emissions: { calculatedTotalEmissions: 0 },
          },
        ],
        futureEmissionsTrendSlope: -50,
      })
    ).toBe(true)
  })

  it('returns false for strongly increasing emissions', () => {
    expect(
      calculateCompanyMeetsParis({
        reportingPeriods: [
          {
            endDate: '2023-12-31',
            emissions: { calculatedTotalEmissions: 1000 },
          },
          {
            endDate: '2024-12-31',
            emissions: { calculatedTotalEmissions: 1200 },
          },
        ],
        futureEmissionsTrendSlope: 200,
      })
    ).toBe(false)
  })
})

describe('toCompanyParisOverviewItem', () => {
  it('maps only fields needed for the Paris overview chart', () => {
    const item = toCompanyParisOverviewItem({
      id: 'company-id',
      wikidataId: 'Q123',
      name: 'Example AB',
      tags: ['sweden'],
      industry: {
        industryGics: {
          sectorCode: '15',
        },
      },
      reportingPeriods: [
        {
          endDate: '2024-12-31',
          emissions: { calculatedTotalEmissions: 1000 },
        },
        {
          endDate: '2023-12-31',
          emissions: { calculatedTotalEmissions: 1100 },
        },
      ],
      baseYear: { year: 2019 },
      futureEmissionsTrendSlope: -20,
    })

    expect(item).toEqual({
      id: 'company-id',
      wikidataId: 'Q123',
      name: 'Example AB',
      meetsParis: expect.any(Boolean),
      emissions: 1000,
      emissionsYear: 2024,
      sectorCode: '15',
      tags: ['sweden'],
    })
  })
})
