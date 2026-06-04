import { canonicalPublicReportUrl } from '../lib/canonicalPublicReportUrl'
import {
  isStorageUrl,
  parseReportYearFromUrl,
  trimStr,
  isValidReportCatalogYear,
} from '../api/services/registryReportIdentity'

export interface RegistrySaveJobData {
  companyName?: string
  wikidata: { node: string }
  url: string
  sourceUrl?: string
  pdfCache?: { publicUrl?: string; sha256?: string }
  /** PDF year label from pipeline (explicit field or max extracted data year). */
  documentReportYear?: string | number
  body: { reportingPeriods: any[] }
}

function isWikidataQId(wikidataId: string): boolean {
  return /^Q\d+$/i.test(wikidataId.trim())
}

// Priority: sha256 match → storage URL match → web URL match → first period.
function findMatchingPeriod(
  reportingPeriods: any[],
  pdfCacheSha256: string | undefined,
  storageUrlToMatch: string | undefined,
  canonicalUrl: string
): any {
  return (
    (pdfCacheSha256
      ? reportingPeriods.find(
          (rp: any) =>
            typeof rp?.reportSha256 === 'string' &&
            rp.reportSha256.trim() === pdfCacheSha256
        )
      : null) ||
    (storageUrlToMatch
      ? reportingPeriods.find(
          (rp: any) =>
            typeof rp?.reportS3Url === 'string' &&
            rp.reportS3Url.trim() === storageUrlToMatch
        )
      : null) ||
    reportingPeriods.find(
      (rp: any) =>
        typeof rp?.reportURL === 'string' &&
        rp.reportURL.trim() === canonicalUrl
    ) ||
    reportingPeriods.find(
      (rp: any) => typeof rp?.reportURL === 'string' && rp.reportURL.trim()
    ) ||
    reportingPeriods[0]
  )
}

function resolveWebUrl(
  ...candidates: (string | undefined)[]
): string | undefined {
  return candidates.find(
    (url): url is string =>
      typeof url === 'string' &&
      url.length > 0 &&
      /^https?:\/\//i.test(url) &&
      !isStorageUrl(url)
  )
}

function resolveStorageUrl(
  periodS3Url: string | undefined,
  pdfCacheS3Url: string | undefined,
  jobUrl: string,
  jobS3Url: string | undefined
): string | undefined {
  return (
    periodS3Url ||
    pdfCacheS3Url ||
    (isStorageUrl(jobUrl) ? jobUrl : undefined) ||
    (jobS3Url && isStorageUrl(jobS3Url) ? jobS3Url : undefined)
  )
}

function maxDataYearAmongPeriods(reportingPeriods: any[]): number | null {
  let max: number | null = null
  for (const period of reportingPeriods) {
    const y = Number(period?.year)
    if (!Number.isFinite(y)) continue
    max = max === null ? y : Math.max(max, y)
  }
  return max
}

/** PDF year for Report / CompanyReport (not a single comparison-period row). */
export function resolveDocumentReportYear(
  reportingPeriods: any[],
  options?: {
    documentReportYear?: string | number | null
    reportUrl?: string | null
    sourceUrl?: string | null
  }
): string | undefined {
  const explicit = options?.documentReportYear
  if (explicit !== undefined && explicit !== null) {
    const y = String(explicit).trim()
    if (isValidReportCatalogYear(y)) return y
  }

  for (const url of [options?.reportUrl, options?.sourceUrl]) {
    const fromUrl = parseReportYearFromUrl(url)
    if (fromUrl && isValidReportCatalogYear(fromUrl)) return fromUrl
  }

  const maxYear = maxDataYearAmongPeriods(reportingPeriods)
  return maxYear !== null ? String(maxYear) : undefined
}

export function buildRegistryPayload(job: {
  data: RegistrySaveJobData
}): null | {
  companyName: string
  wikidataId: string
  reportYear?: string
  url: string
  sourceUrl?: string
  s3Url?: string
  sha256?: string
} {
  const companyName = job.data.companyName
  if (!companyName) return null

  const wikidataId = job.data.wikidata.node.trim()
  if (!isWikidataQId(wikidataId)) return null

  const reportingPeriods = job.data.body?.reportingPeriods
  if (!Array.isArray(reportingPeriods) || reportingPeriods.length === 0)
    return null

  const url = typeof job.data.url === 'string' ? job.data.url.trim() : ''
  const sourceUrl =
    typeof job.data.sourceUrl === 'string'
      ? job.data.sourceUrl.trim()
      : undefined

  const pdfCacheSha256 = trimStr(job.data.pdfCache?.sha256) ?? undefined
  const pdfCacheS3Url = trimStr(job.data.pdfCache?.publicUrl) ?? undefined

  const sourceUrlIsHttp =
    typeof sourceUrl === 'string' && /^https?:\/\//i.test(sourceUrl)
  const jobS3Url =
    url && (!sourceUrlIsHttp || url !== sourceUrl) ? url : undefined

  const canonicalUrl = canonicalPublicReportUrl({ url, sourceUrl })
  const s3UrlToMatch = pdfCacheS3Url || jobS3Url

  const chosenPeriod = findMatchingPeriod(
    reportingPeriods,
    pdfCacheSha256,
    s3UrlToMatch,
    canonicalUrl
  )

  const periodReportUrl = trimStr(chosenPeriod?.reportURL) ?? undefined
  const periodS3Url = trimStr(chosenPeriod?.reportS3Url) ?? undefined
  const periodSha256 = trimStr(chosenPeriod?.reportSha256) ?? undefined

  const resolvedWebUrl = resolveWebUrl(periodReportUrl, sourceUrl, canonicalUrl)
  const resolvedStorageUrl = resolveStorageUrl(
    periodS3Url,
    pdfCacheS3Url,
    url,
    jobS3Url
  )

  const primaryUrl = resolvedWebUrl || (periodReportUrl || canonicalUrl).trim()

  if (!primaryUrl) return null

  let s3Url: string | undefined
  if (resolvedStorageUrl) {
    if (resolvedStorageUrl !== primaryUrl || isStorageUrl(primaryUrl)) {
      s3Url = resolvedStorageUrl
    }
  } else if (isStorageUrl(primaryUrl)) {
    s3Url = primaryUrl
  }

  return {
    companyName,
    wikidataId,
    reportYear: resolveDocumentReportYear(reportingPeriods, {
      documentReportYear: job.data.documentReportYear,
      reportUrl: primaryUrl,
      sourceUrl:
        sourceUrlIsHttp && sourceUrl && !isStorageUrl(sourceUrl)
          ? sourceUrl
          : undefined,
    }),
    url: primaryUrl,
    sourceUrl:
      sourceUrlIsHttp && sourceUrl && !isStorageUrl(sourceUrl)
        ? sourceUrl
        : undefined,
    s3Url,
    sha256: pdfCacheSha256 ?? periodSha256,
  }
}
