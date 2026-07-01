import { companyReportIdFromJobData, companyIdFromJobData } from '../src/lib/reportRunPersistence'

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

describe('companyIdFromJobData', () => {
  it('returns trimmed companyId from job data', () => {
    expect(companyIdFromJobData({ companyId: '  uuid-here  ' })).toBe(
      'uuid-here'
    )
  })

  it('returns null when missing or empty', () => {
    expect(companyIdFromJobData({})).toBeNull()
    expect(companyIdFromJobData({ companyId: '  ' })).toBeNull()
    expect(companyIdFromJobData(null)).toBeNull()
  })
})
