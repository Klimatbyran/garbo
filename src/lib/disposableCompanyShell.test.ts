import { describe, it, expect } from '@jest/globals'
import {
  explainDisposableCompanyShell,
  isDisposableCompanyShell,
  type DisposableCompanyShellSnapshot,
} from './disposableCompanyShell'

const VALID_LEI = '5493001KJTIIGC8Y1R12'

function shell(
  overrides: Partial<DisposableCompanyShellSnapshot> = {}
): DisposableCompanyShellSnapshot {
  return {
    id: 'company-1',
    name: 'Example AB',
    wikidataId: null,
    lei: null,
    reportingPeriodCount: 0,
    companyReports: [],
    identifiers: [],
    activeReportRunCount: 0,
    ...overrides,
  }
}

describe('isDisposableCompanyShell', () => {
  it('accepts a name-only empty shell', () => {
    expect(isDisposableCompanyShell(shell())).toBe(true)
  })

  it('accepts empty null-registry CompanyReport shells', () => {
    expect(
      isDisposableCompanyShell(
        shell({
          companyReports: [{ registryReportId: null }],
        })
      )
    ).toBe(true)
  })

  it('rejects shells with reporting periods', () => {
    expect(isDisposableCompanyShell(shell({ reportingPeriodCount: 1 }))).toBe(
      false
    )
  })

  it('rejects shells with wikidata column or identifier', () => {
    expect(isDisposableCompanyShell(shell({ wikidataId: 'Q123' }))).toBe(false)
    expect(
      isDisposableCompanyShell(
        shell({
          identifiers: [{ type: 'WIKIDATA', value: 'Q123' }],
        })
      )
    ).toBe(false)
  })

  it('rejects shells with a valid LEI on column or identifier', () => {
    expect(isDisposableCompanyShell(shell({ lei: VALID_LEI }))).toBe(false)
    expect(
      isDisposableCompanyShell(
        shell({
          identifiers: [{ type: 'LEI', value: VALID_LEI }],
        })
      )
    ).toBe(false)
  })

  it('rejects shells with a registry-linked CompanyReport', () => {
    expect(
      isDisposableCompanyShell(
        shell({
          companyReports: [{ registryReportId: 'report-1' }],
        })
      )
    ).toBe(false)
  })

  it('rejects shells referenced by an active ReportRun', () => {
    expect(isDisposableCompanyShell(shell({ activeReportRunCount: 1 }))).toBe(
      false
    )
  })
})

describe('explainDisposableCompanyShell', () => {
  it('lists reject reasons without duplicates', () => {
    const result = explainDisposableCompanyShell(
      shell({
        wikidataId: 'Q1',
        identifiers: [{ type: 'WIKIDATA', value: 'Q1' }],
        reportingPeriodCount: 2,
      })
    )
    expect(result.disposable).toBe(false)
    expect(result.reasons).toEqual(
      expect.arrayContaining(['has_wikidata', 'has_reporting_periods'])
    )
    expect(result.reasons.filter((r) => r === 'has_wikidata')).toHaveLength(1)
  })
})
