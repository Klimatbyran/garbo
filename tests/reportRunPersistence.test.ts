import {
  companyReportIdFromJobData,
  companyIdFromJobData,
  registryReportIdFromJobData,
  reportRunSyncFieldsFromJob,
} from '../src/lib/reportRunPersistence'

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

describe('registryReportIdFromJobData', () => {
  it('returns trimmed autoRunReportId from job data', () => {
    expect(
      registryReportIdFromJobData({ autoRunReportId: '  report-1  ' })
    ).toBe('report-1')
  })

  it('returns null when missing or empty', () => {
    expect(registryReportIdFromJobData({})).toBeNull()
    expect(registryReportIdFromJobData({ autoRunReportId: '  ' })).toBeNull()
    expect(registryReportIdFromJobData(null)).toBeNull()
  })
})

describe('reportRunSyncFieldsFromJob', () => {
  it('includes companyId and wikidataId when present', () => {
    expect(
      reportRunSyncFieldsFromJob({
        companyName: 'Alfa Laval',
        companyId: '11111111-1111-4111-8111-111111111111',
        wikidataId: 'Q686030',
        companyReportId: 'cr-1',
        batchDbId: 'batch-1',
        registryReportId: 'report-1',
      })
    ).toEqual({
      companyName: 'Alfa Laval',
      companyId: '11111111-1111-4111-8111-111111111111',
      wikidataId: 'Q686030',
      companyReportId: 'cr-1',
      batchDbId: 'batch-1',
      registryReportId: 'report-1',
    })
  })

  it('omits empty companyId and wikidataId so stale values are not cleared', () => {
    expect(
      reportRunSyncFieldsFromJob({
        companyName: 'Alfa Laval',
        companyId: null,
        wikidataId: null,
        registryReportId: null,
      })
    ).toEqual({
      companyName: 'Alfa Laval',
    })
  })
})
