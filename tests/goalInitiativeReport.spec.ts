import {
  reportConnectCreate,
  reportRelationUpdate,
  resolveBatchReportId,
  resolveItemReportId,
  shouldReplaceUnverifiedForReport,
} from '../src/lib/goalInitiativeReport'

describe('goalInitiativeReport helpers', () => {
  it('resolves batch and item report ids', () => {
    expect(resolveBatchReportId('  r1  ')).toBe('r1')
    expect(resolveBatchReportId('')).toBeNull()
    expect(resolveBatchReportId(undefined)).toBeNull()
    expect(resolveItemReportId('item', 'batch')).toBe('item')
    expect(resolveItemReportId('  ', 'batch')).toBe('batch')
    expect(resolveItemReportId(undefined, 'batch')).toBe('batch')
    expect(resolveItemReportId(null, null)).toBeNull()
  })

  it('gates replace behind flag and batch reportId', () => {
    expect(
      shouldReplaceUnverifiedForReport(
        { replaceUnverifiedForReport: true },
        'r1'
      )
    ).toBe(true)
    expect(
      shouldReplaceUnverifiedForReport(
        { replaceUnverifiedForReport: true },
        null
      )
    ).toBe(false)
    expect(
      shouldReplaceUnverifiedForReport(
        { replaceUnverifiedForReport: false },
        'r1'
      )
    ).toBe(false)
    expect(shouldReplaceUnverifiedForReport({}, 'r1')).toBe(false)
  })

  it('builds report relation create/update payloads', () => {
    expect(reportConnectCreate('r1')).toEqual({
      report: { connect: { id: 'r1' } },
    })
    expect(reportConnectCreate(null)).toEqual({})
    expect(reportRelationUpdate(undefined)).toEqual({})
    expect(reportRelationUpdate(null)).toEqual({
      report: { disconnect: true },
    })
    expect(reportRelationUpdate('')).toEqual({
      report: { disconnect: true },
    })
    expect(reportRelationUpdate('r1')).toEqual({
      report: { connect: { id: 'r1' } },
    })
  })
})
