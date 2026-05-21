import { canonicalPublicReportUrl } from '../lib/saveUtils'
import { isStorageUrl, trimStr } from '../api/services/registryReportIdentity'

export interface RegistrySaveJobData {
  companyName?: string
  wikidata: { node: string }
  url: string
  sourceUrl?: string
  pdfCache?: { publicUrl?: string; sha256?: string }
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
        typeof rp?.reportURL === 'string' && rp.reportURL.trim() === canonicalUrl
    ) ||
    reportingPeriods.find(
      (rp: any) => typeof rp?.reportURL === 'string' && rp.reportURL.trim()
    ) ||
    reportingPeriods[0]
  )
}

// Returns the first candidate that is a proper web URL (not a storage link).
function firstWebUrl(...candidates: (string | undefined)[]): string | undefined {
  return candidates.find(
    (url): url is string =>
      typeof url === 'string' &&
      url.length > 0 &&
      /^https?:\/\//i.test(url) &&
      !isStorageUrl(url)
  )
}

// Returns the best available storage URL from the known sources.
function resolveStorageUrl(
  periodStorageUrl: string | undefined,
  pdfCacheStorageUrl: string | undefined,
  jobUrl: string,
  jobStorageUrl: string | undefined
): string | undefined {
  return (
    periodStorageUrl ||
    pdfCacheStorageUrl ||
    (isStorageUrl(jobUrl) ? jobUrl : undefined) ||
    (jobStorageUrl && isStorageUrl(jobStorageUrl) ? jobStorageUrl : undefined)
  )
}

// Returns the year from the chosen period, or falls back to the highest year across all periods.
function resolveReportYear(chosenPeriod: any, reportingPeriods: any[]): string | undefined {
  const year = chosenPeriod?.year
  if (typeof year === 'number') return year.toString()
  if (typeof year === 'string') return year

  const maxYear = reportingPeriods.reduce((max: number | null, rp: any) => {
    const y = Number(rp?.year)
    if (!Number.isFinite(y)) return max
    return max === null ? y : Math.max(max, y)
  }, null as number | null)

  return maxYear !== null ? maxYear.toString() : undefined
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
  if (!Array.isArray(reportingPeriods) || reportingPeriods.length === 0) return null

  const url = typeof job.data.url === 'string' ? job.data.url.trim() : ''
  const sourceUrl =
    typeof job.data.sourceUrl === 'string' ? job.data.sourceUrl.trim() : undefined

  const pdfCacheSha256 = trimStr(job.data.pdfCache?.sha256) ?? undefined
  const pdfCacheStorageUrl = trimStr(job.data.pdfCache?.publicUrl) ?? undefined

  const sourceUrlIsHttp =
    typeof sourceUrl === 'string' && /^https?:\/\//i.test(sourceUrl)
  const jobStorageUrl =
    url && (!sourceUrlIsHttp || url !== sourceUrl) ? url : undefined

  const canonicalUrl = canonicalPublicReportUrl({ url, sourceUrl })
  const storageUrlToMatch = pdfCacheStorageUrl || jobStorageUrl

  const chosenPeriod = findMatchingPeriod(
    reportingPeriods,
    pdfCacheSha256,
    storageUrlToMatch,
    canonicalUrl
  )

  const periodWebUrl = trimStr(chosenPeriod?.reportURL) ?? undefined
  const periodStorageUrl = trimStr(chosenPeriod?.reportS3Url) ?? undefined
  const periodSha256 = trimStr(chosenPeriod?.reportSha256) ?? undefined

  const webUrl = firstWebUrl(periodWebUrl, sourceUrl, canonicalUrl)
  const resolvedStorageUrl = resolveStorageUrl(
    periodStorageUrl,
    pdfCacheStorageUrl,
    url,
    jobStorageUrl
  )

  const primaryUrl =
    webUrl || (periodWebUrl || canonicalUrl).trim() || canonicalUrl || url || ''

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
    reportYear: resolveReportYear(chosenPeriod, reportingPeriods),
    url: primaryUrl,
    sourceUrl:
      sourceUrlIsHttp && sourceUrl && !isStorageUrl(sourceUrl) ? sourceUrl : undefined,
    s3Url,
    sha256: pdfCacheSha256 ?? periodSha256,
  }
}
