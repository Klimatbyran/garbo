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

function periodHasEmissionsOrEconomyData(period: any): boolean {
  const economy = period?.economy
  if (
    economy &&
    typeof economy === 'object' &&
    Object.keys(economy).length > 0
  ) {
    return true
  }

  const emissions = period?.emissions
  if (!emissions || typeof emissions !== 'object') return false

  return Object.values(emissions).some(
    (value) => value !== undefined && value !== null
  )
}

/** Data year on a period payload: explicit `year` or calendar year from `endDate`. */
export function periodDataYearFromPayload(period: any): number | null {
  if (period?.year !== undefined && period?.year !== null) {
    const explicit = Number(period.year)
    if (Number.isFinite(explicit)) return explicit
  }

  const end = period?.endDate
  if (end instanceof Date) return end.getFullYear()
  if (typeof end === 'string' && end.length >= 4) {
    const fromEnd = Number(end.slice(0, 4))
    if (Number.isFinite(fromEnd)) return fromEnd
  }

  return null
}

function maxDataYearAmongPeriods(reportingPeriods: any[]): number | null {
  let max: number | null = null
  for (const period of reportingPeriods) {
    if (!periodHasEmissionsOrEconomyData(period)) continue
    const y = periodDataYearFromPayload(period)
    if (y === null) continue
    max = max === null ? y : Math.max(max, y)
  }
  return max
}

/**
 * PDF year label for Report / CompanyReport.
 * Priority: pipeline/job field → max data year (emissions/economy periods only) → URL parse.
 */
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

  const maxYear = maxDataYearAmongPeriods(reportingPeriods)
  if (maxYear !== null) return String(maxYear)

  for (const url of [options?.reportUrl, options?.sourceUrl]) {
    const fromUrl = parseReportYearFromUrl(url)
    if (fromUrl && isValidReportCatalogYear(fromUrl)) return fromUrl
  }

  return undefined
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

export type EarlyRegistryJobData = {
  companyName?: string
  wikidata?: { node: string }
  url?: string
  sourceUrl?: string
  pdfCache?: { publicUrl?: string; sha256?: string }
  documentReportYear?: string | number
}

/** Registry upsert from PDF identity only (before reporting periods exist). */
export function buildEarlyRegistryPayload(
  jobData: EarlyRegistryJobData
): null | {
  companyName: string
  wikidataId: string
  reportYear?: string
  url: string
  sourceUrl?: string
  s3Url?: string
  sha256?: string
} {
  const companyName = jobData.companyName
  if (!companyName) return null

  const wikidataId = jobData.wikidata?.node?.trim() ?? ''
  if (!isWikidataQId(wikidataId)) return null

  const url = typeof jobData.url === 'string' ? jobData.url.trim() : ''
  const sourceUrl =
    typeof jobData.sourceUrl === 'string' ? jobData.sourceUrl.trim() : undefined

  const pdfCacheSha256 = trimStr(jobData.pdfCache?.sha256) ?? undefined
  const pdfCacheS3Url = trimStr(jobData.pdfCache?.publicUrl) ?? undefined

  const sourceUrlIsHttp =
    typeof sourceUrl === 'string' && /^https?:\/\//i.test(sourceUrl)
  const jobS3Url =
    url && (!sourceUrlIsHttp || url !== sourceUrl) ? url : undefined

  const canonicalUrl = canonicalPublicReportUrl({ url, sourceUrl })
  const resolvedWebUrl = resolveWebUrl(sourceUrl, canonicalUrl)
  const resolvedStorageUrl = resolveStorageUrl(
    undefined,
    pdfCacheS3Url,
    url,
    jobS3Url
  )

  const primaryUrl = resolvedWebUrl || canonicalUrl.trim()
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
    reportYear: resolveDocumentReportYear([], {
      documentReportYear: jobData.documentReportYear,
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
    sha256: pdfCacheSha256,
  }
}

/** POST /companies/:id/reporting-periods response shape (internal API). */
export function companyReportIdFromPeriodSaveResponse(
  saved: unknown,
): string | null {
  if (!saved || typeof saved !== 'object') return null
  const id = (saved as { companyReportId?: unknown }).companyReportId
  return typeof id === 'string' && id.trim() ? id.trim() : null
}
