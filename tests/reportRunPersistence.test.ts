import {
  companyReportIdFromJobData,
  companyIdFromJobData,
  registryReportIdFromJobData,
  reportRunSyncFieldsFromJob,
  returnValueObjectFromJob,
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

describe('returnValueObjectFromJob', () => {
  it('parses a JSON object string', () => {
    expect(
      returnValueObjectFromJob('{"value":{"a":1},"metadata":{"model":"m"}}')
    ).toEqual({ value: { a: 1 }, metadata: { model: 'm' } })
  })

  it('returns an object as is', () => {
    const value = { value: { a: 1 } }
    expect(returnValueObjectFromJob(value)).toBe(value)
  })

  it('returns null for a job id that parses as a number', () => {
    expect(returnValueObjectFromJob('86')).toBeNull()
    expect(returnValueObjectFromJob(86)).toBeNull()
  })

  it('returns null for plain strings and empty values', () => {
    expect(returnValueObjectFromJob('Permanent TSB')).toBeNull()
    expect(returnValueObjectFromJob('true')).toBeNull()
    expect(returnValueObjectFromJob('')).toBeNull()
    expect(returnValueObjectFromJob(null)).toBeNull()
    expect(returnValueObjectFromJob(undefined)).toBeNull()
  })
})
