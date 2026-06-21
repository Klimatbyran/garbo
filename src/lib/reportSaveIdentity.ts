import { canonicalPublicReportUrl } from './canonicalPublicReportUrl'
import { resolveDocumentReportYear } from '../workers/saveToAPI.utils'

export type PipelineReportIdentity = {
  reportURL: string
  reportS3Url?: string
  reportSha256?: string
}

type JobReportFields = {
  url: string
  sourceUrl?: string
  pdfCache?: { publicUrl?: string; sha256?: string }
  documentReportYear?: string | number
  registryReportId?: string
  replaceAllEmissions?: boolean
}

function trimOptional(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

/** Identity fields for the PDF this pipeline job is processing. */
export function buildPipelineReportIdentity(jobData: {
  url: string
  sourceUrl?: string
  pdfCache?: { publicUrl?: string; sha256?: string }
}): PipelineReportIdentity {
  const trimmedUrl = trimOptional(jobData.url) ?? ''
  const trimmedSourceUrl = trimOptional(jobData.sourceUrl)
  const sourceIsHttp =
    typeof trimmedSourceUrl === 'string' &&
    /^https?:\/\//i.test(trimmedSourceUrl)

  const reportS3Url =
    trimOptional(jobData.pdfCache?.publicUrl) ||
    (trimmedUrl && (!sourceIsHttp || trimmedUrl !== trimmedSourceUrl)
      ? trimmedUrl
      : undefined)

  return {
    reportURL: canonicalPublicReportUrl({
      url: jobData.url,
      sourceUrl: jobData.sourceUrl,
    }),
    reportS3Url,
    reportSha256: trimOptional(jobData.pdfCache?.sha256),
  }
}

export function periodMatchesReportIdentity(
  period: {
    reportURL?: string | null
    reportS3Url?: string | null
    reportSha256?: string | null
  },
  identity: PipelineReportIdentity
): boolean {
  const periodSha = trimOptional(period.reportSha256)
  const periodS3 = trimOptional(period.reportS3Url)
  const periodUrl = trimOptional(period.reportURL)

  if (identity.reportSha256 && periodSha === identity.reportSha256) return true
  if (identity.reportS3Url && periodS3 === identity.reportS3Url) return true
  if (identity.reportURL && periodUrl === identity.reportURL) return true

  return false
}

/** True when any reporting period already stores this PDF identity. */
export function isReportIdentityKnownInCompany(
  company: { reportingPeriods?: unknown } | null | undefined,
  identity: PipelineReportIdentity
): boolean {
  const periods = Array.isArray(company?.reportingPeriods)
    ? company.reportingPeriods
    : []
  return periods.some((period) =>
    periodMatchesReportIdentity(period as PipelineReportIdentity, identity)
  )
}

/** Period rows already linked to this PDF — used as the diff "before" baseline. */
export function reportingPeriodsForReportIdentity(
  company: { reportingPeriods?: unknown } | null | undefined,
  identity: PipelineReportIdentity
): unknown[] {
  const periods = Array.isArray(company?.reportingPeriods)
    ? company.reportingPeriods
    : []
  const matched = periods.filter((period) =>
    periodMatchesReportIdentity(period as PipelineReportIdentity, identity)
  )
  return matched
}

/** Top-level POST fields for reporting-periods save (registry + CompanyReport resolution). */
export function buildReportingPeriodsApiBodyExtras(
  jobData: JobReportFields,
  reportingPeriods: unknown[]
): Record<string, unknown> {
  // TODO(pipeline): registryReportId from checkDB is forwarded here so period save can resolve
  // the CompanyReport shell without falling back to "latest shell for company".
  const identity = buildPipelineReportIdentity(jobData)
  const trimmedSourceUrl = trimOptional(jobData.sourceUrl)
  const documentReportYear = resolveDocumentReportYear(reportingPeriods, {
    documentReportYear: jobData.documentReportYear,
    reportUrl: identity.reportURL,
    sourceUrl: trimmedSourceUrl,
  })

  return {
    ...(jobData.replaceAllEmissions && { replaceAllEmissions: true }),
    documentReportYear,
    reportUrl: identity.reportURL,
    reportSourceUrl: trimmedSourceUrl,
    reportS3Url: identity.reportS3Url,
    reportSha256: identity.reportSha256,
    ...(trimOptional(jobData.registryReportId) && {
      registryReportId: trimOptional(jobData.registryReportId),
    }),
  }
}
