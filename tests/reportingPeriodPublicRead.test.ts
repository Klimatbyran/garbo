import { pickOnePeriodPerDataYear } from '../src/api/services/reportingPeriodPublicRead'

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
    expect(result.find((p) => p.year === '2024')?.id).toBe('period-2024-report-old')
  })

  it('strips companyReport from the result', () => {
    const result = pickOnePeriodPerDataYear([period('2024', '2024', 'report-a')])
    expect(result[0]).not.toHaveProperty('companyReport')
  })
})
