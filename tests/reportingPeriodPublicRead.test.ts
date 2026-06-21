import {
  pickOnePeriodPerDataYear,
  toPartnerCompanyList,
  toPartnerCompanyResponse,
} from '../src/api/services/reportingPeriodPublicRead'

function period(
  year: string,
  companyReportYear: string | null,
  companyReportId: string
) {
  return {
    year,
    id: `period-${year}-${companyReportId}`,
    companyReport: {
      id: companyReportId,
      reportYear: companyReportYear,
      reportPublicationDate: null,
    },
  }
}

describe('pickOnePeriodPerDataYear', () => {
  it('returns one period per data year', () => {
    const result = pickOnePeriodPerDataYear([
      period('2024', '2024', 'report-a'),
      period('2025', '2024', 'report-a'),
    ])
    expect(result).toHaveLength(2)
    expect(result.map((p) => p.year).sort()).toEqual(['2024', '2025'])
  })

  it('prefers the period from the higher CompanyReport.reportYear for the same data year', () => {
    const result = pickOnePeriodPerDataYear([
      period('2024', '2024', 'report-old'),
      period('2024', '2025', 'report-new'),
    ])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('period-2024-report-new')
    expect(result[0]).not.toHaveProperty('companyReport')
  })

  it('keeps older report data when newer report has no row for that year', () => {
    const result = pickOnePeriodPerDataYear([
      period('2024', '2024', 'report-old'),
      period('2025', '2025', 'report-new'),
    ])
    expect(result.map((p) => p.year).sort()).toEqual(['2024', '2025'])
    expect(result.find((p) => p.year === '2024')?.id).toBe(
      'period-2024-report-old'
    )
  })

  it('strips companyReport from the result', () => {
    const result = pickOnePeriodPerDataYear([
      period('2024', '2024', 'report-a'),
    ])
    expect(result[0]).not.toHaveProperty('companyReport')
  })
})

describe('toPartnerCompanyResponse', () => {
  it('removes year, companyReportId, and companyReport from reporting periods', () => {
    const result = toPartnerCompanyResponse({
      wikidataId: 'Q1',
      name: 'Acme',
      reportingPeriods: [
        {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          year: '2024',
          companyReportId: 'cr-1',
          companyReport: { id: 'cr-1', reportYear: '2024' },
          reportURL: 'https://example.com/report.pdf',
        },
      ],
    })

    expect(result.reportingPeriods[0]).toEqual({
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      reportURL: 'https://example.com/report.pdf',
    })
  })

  it('maps a company list for external GET responses', () => {
    const result = toPartnerCompanyList([
      {
        wikidataId: 'Q1',
        reportingPeriods: [{ year: '2024', companyReportId: 'cr-1' }],
      },
    ])

    expect(result[0].reportingPeriods[0]).toEqual({})
  })
})
