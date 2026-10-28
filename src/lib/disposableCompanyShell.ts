import { normalizeLei } from './normalizeLei'

export type CompanyShellReportRow = {
  registryReportId: string | null
}

export type CompanyShellIdentifierRow = {
  type: string
  value: string
}

/**
 * Snapshot used to decide whether a company row is a disposable empty shell
 * (name-only create abandoned after identifier re-resolve).
 */
export type DisposableCompanyShellSnapshot = {
  id: string
  name: string
  wikidataId: string | null
  lei: string | null
  url: string | null
  logoUrl: string | null
  description: string | null
  internalComment: string | null
  tags: string[]
  alternativeNames: string[]
  reportingPeriodCount: number
  goalCount: number
  initiativeCount: number
  descriptionCount: number
  hasIndustry: boolean
  hasBaseYear: boolean
  companyReports: CompanyShellReportRow[]
  identifiers: CompanyShellIdentifierRow[]
  /** ReportRuns still in `running` that reference this company id. */
  activeReportRunCount: number
}

export type DisposableCompanyShellRejectReason =
  | 'has_reporting_periods'
  | 'has_wikidata'
  | 'has_lei'
  | 'has_other_identifier'
  | 'has_registry_linked_report'
  | 'has_active_report_run'
  | 'has_profile_fields'
  | 'has_related_records'

const OTHER_IDENTIFIER_TYPES = new Set(['ORG_NUMBER', 'ISIN'])

/**
 * True when the company looks like an abandoned name-only shell with no
 * durable identity or related data. Safe candidate for cleanup.
 */
export function isDisposableCompanyShell(
  snapshot: DisposableCompanyShellSnapshot
): boolean {
  return explainDisposableCompanyShell(snapshot).disposable
}

export function explainDisposableCompanyShell(
  snapshot: DisposableCompanyShellSnapshot
): {
  disposable: boolean
  reasons: DisposableCompanyShellRejectReason[]
} {
  const reasons: DisposableCompanyShellRejectReason[] = []

  if (snapshot.reportingPeriodCount > 0) {
    reasons.push('has_reporting_periods')
  }

  if (snapshot.wikidataId?.trim()) {
    reasons.push('has_wikidata')
  }

  if (
    normalizeLei(snapshot.lei) ||
    snapshot.identifiers.some(
      (row) => row.type === 'LEI' && Boolean(normalizeLei(row.value))
    )
  ) {
    reasons.push('has_lei')
  }

  if (
    snapshot.identifiers.some(
      (row) => row.type === 'WIKIDATA' && Boolean(row.value.trim())
    )
  ) {
    reasons.push('has_wikidata')
  }

  if (
    snapshot.identifiers.some(
      (row) => OTHER_IDENTIFIER_TYPES.has(row.type) && Boolean(row.value.trim())
    )
  ) {
    reasons.push('has_other_identifier')
  }

  if (
    snapshot.companyReports.some((report) =>
      Boolean(report.registryReportId?.trim())
    )
  ) {
    reasons.push('has_registry_linked_report')
  }

  if (snapshot.activeReportRunCount > 0) {
    reasons.push('has_active_report_run')
  }

  if (
    snapshot.url?.trim() ||
    snapshot.logoUrl?.trim() ||
    snapshot.description?.trim() ||
    snapshot.internalComment?.trim() ||
    snapshot.tags.length > 0 ||
    snapshot.alternativeNames.length > 0
  ) {
    reasons.push('has_profile_fields')
  }

  if (
    snapshot.goalCount > 0 ||
    snapshot.initiativeCount > 0 ||
    snapshot.descriptionCount > 0 ||
    snapshot.hasIndustry ||
    snapshot.hasBaseYear
  ) {
    reasons.push('has_related_records')
  }

  return {
    disposable: reasons.length === 0,
    reasons: [...new Set(reasons)],
  }
}
