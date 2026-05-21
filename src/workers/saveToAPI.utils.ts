import { canonicalPublicReportUrl } from '../lib/saveUtils'
import { isStorageUrl } from '../api/services/registryReportIdentity'

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

export function pickRegistryPayloadFromReportingPeriodsSave(
  job: { data: RegistrySaveJobData }
): null | {
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

  const url = typeof job.data.url === 'string' ? job.data.url.trim() : ''
  const sourceUrl =
    typeof job.data.sourceUrl === 'string'
      ? job.data.sourceUrl.trim()
      : undefined
  const pdfCache = job.data.pdfCache

  const reportingPeriods = job.data.body?.reportingPeriods
  if (!Array.isArray(reportingPeriods) || reportingPeriods.length === 0)
    return null

  const canonicalReportUrl = canonicalPublicReportUrl({ url, sourceUrl })

  const sha256FromPdfCache =
    typeof pdfCache?.sha256 === 'string' && pdfCache.sha256.trim()
      ? pdfCache.sha256.trim()
      : undefined

  const s3UrlFromPdfCache =
    typeof pdfCache?.publicUrl === 'string' && pdfCache.publicUrl.trim()
      ? pdfCache.publicUrl.trim()
      : undefined

  const sourceIsHttp =
    typeof sourceUrl === 'string' && /^https?:\/\//i.test(sourceUrl)

  const s3UrlFromJobUrl =
    url && (!sourceIsHttp || url !== sourceUrl) ? url : undefined

  const expectedS3Url = s3UrlFromPdfCache || s3UrlFromJobUrl

  const normalizeYear = (year: any): string | undefined => {
    if (typeof year === 'number') return year.toString()
    if (typeof year === 'string') return year
    return undefined
  }

  const maxYear = reportingPeriods.reduce(
    (max: number | null, rp: any) => {
      const y = Number(rp?.year)
      if (!Number.isFinite(y)) return max
      if (max === null) return y
      return Math.max(max, y)
    },
    null as number | null
  )

  const chosen =
    (sha256FromPdfCache
      ? reportingPeriods.find(
          (rp: any) =>
            typeof rp?.reportSha256 === 'string' &&
            rp.reportSha256.trim() === sha256FromPdfCache
        )
      : null) ||
    (expectedS3Url
      ? reportingPeriods.find(
          (rp: any) =>
            typeof rp?.reportS3Url === 'string' &&
            rp.reportS3Url.trim() === expectedS3Url
        )
      : null) ||
    reportingPeriods.find(
      (rp: any) =>
        typeof rp?.reportURL === 'string' &&
        rp.reportURL.trim() === canonicalReportUrl
    ) ||
    reportingPeriods.find(
      (rp: any) => typeof rp?.reportURL === 'string' && rp.reportURL.trim()
    ) ||
    reportingPeriods[0]

  const reportYear =
    normalizeYear(chosen?.year) ??
    (maxYear !== null ? maxYear.toString() : undefined)

  const chosenReportPageUrl =
    typeof chosen?.reportURL === 'string' && chosen.reportURL.trim()
      ? chosen.reportURL.trim()
      : ''

  const reportURL = chosenReportPageUrl || canonicalReportUrl

  const reportS3Url =
    typeof chosen?.reportS3Url === 'string' && chosen.reportS3Url.trim()
      ? chosen.reportS3Url.trim()
      : undefined

  const reportSha256 =
    typeof chosen?.reportSha256 === 'string' && chosen.reportSha256.trim()
      ? chosen.reportSha256.trim()
      : undefined

  const trimmedJobUrl = url.trim()

  const humanResolved =
    [
      chosenReportPageUrl &&
      /^https?:\/\//i.test(chosenReportPageUrl) &&
      !isStorageUrl(chosenReportPageUrl)
        ? chosenReportPageUrl
        : undefined,
      sourceIsHttp && sourceUrl && !isStorageUrl(sourceUrl)
        ? sourceUrl.trim()
        : undefined,
      canonicalReportUrl &&
      /^https?:\/\//i.test(canonicalReportUrl) &&
      !isStorageUrl(canonicalReportUrl)
        ? canonicalReportUrl
        : undefined,
    ].find(Boolean) ?? undefined

  const assetResolved =
    reportS3Url ||
    s3UrlFromPdfCache ||
    (trimmedJobUrl && isStorageUrl(trimmedJobUrl)
      ? trimmedJobUrl
      : undefined) ||
    (s3UrlFromJobUrl && isStorageUrl(s3UrlFromJobUrl)
      ? s3UrlFromJobUrl
      : undefined)

  const urlForUniqueRow =
    humanResolved ||
    reportURL.trim() ||
    canonicalReportUrl ||
    trimmedJobUrl ||
    ''

  if (!urlForUniqueRow) return null

  let s3Url: string | undefined
  if (assetResolved) {
    if (
      assetResolved !== urlForUniqueRow ||
      isStorageUrl(urlForUniqueRow)
    ) {
      s3Url = assetResolved
    }
  } else if (isStorageUrl(urlForUniqueRow)) {
    s3Url = urlForUniqueRow
  }

  const sourceUrlOut =
    sourceIsHttp && sourceUrl && !isStorageUrl(sourceUrl.trim())
      ? sourceUrl.trim()
      : undefined

  const sha256 = sha256FromPdfCache ?? reportSha256

  return {
    companyName,
    wikidataId,
    reportYear,
    url: urlForUniqueRow,
    sourceUrl: sourceUrlOut,
    s3Url,
    sha256,
  }
}
