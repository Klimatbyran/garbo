import { companyReportIdFromJobData } from '../src/lib/reportRunPersistence'

describe('companyReportIdFromJobData', () => {
  it('returns trimmed companyReportId from job data', () => {
    expect(companyReportIdFromJobData({ companyReportId: '  cr-abc  ' })).toBe(
      'cr-abc'
    )
  })

  it('returns null when missing or empty', () => {
    expect(companyReportIdFromJobData({})).toBeNull()
    expect(companyReportIdFromJobData({ companyReportId: '  ' })).toBeNull()
    expect(companyReportIdFromJobData(null)).toBeNull()
  })
})
