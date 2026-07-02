import { Prisma } from '@prisma/client'

// Typed explicitly so it stays valid before `prisma generate` runs after a schema change.
export interface RegistryReportIdentityRow {
  id: string
  url: string
  companyName: string | null
  wikidataId: string | null
  reportYear: string | null
  sourceUrl?: string | null
  s3Url?: string | null
  s3Key?: string | null
  s3Bucket?: string | null
  sha256?: string | null
}

const STORAGE_URL_PATTERNS = ['storage.googleapis.com']

export function isStorageUrl(raw: string | null | undefined): boolean {
  if (typeof raw !== 'string' || !raw.trim()) return false
  const lowercased = raw.trim().toLowerCase()
  return STORAGE_URL_PATTERNS.some((pattern) => lowercased.includes(pattern))
}

export function trimStr(s: string | null | undefined): string | null {
  if (typeof s !== 'string') return null
  const trimmed = s.trim()
  return trimmed.length ? trimmed : null
}

export function isPlaceholderCompanyName(
  name: string | null | undefined
): boolean {
  const trimmed = trimStr(name)
  if (!trimmed) return true
  return trimmed.toLowerCase() === 'unknown'
}

/** Registry upsert: keep existing name unless it is missing or the placeholder "Unknown". */
export function mergeCompanyNameFromPipeline(
  existing: string | null | undefined,
  incoming: string | null | undefined
): string | undefined {
  if (!isPlaceholderCompanyName(existing)) {
    return trimStr(existing) ?? undefined
  }
  if (isPlaceholderCompanyName(incoming)) {
    return trimStr(existing) ?? trimStr(incoming) ?? undefined
  }
  return trimStr(incoming) ?? undefined
}

/** Backfill / one-off catalog year parsing (tight window for current registry cleanup). */
const REPORT_CATALOG_YEAR_MIN = 2000
const REPORT_CATALOG_YEAR_MAX = 2026

export function isValidReportCatalogYear(year: string): boolean {
  if (!/^\d{4}$/.test(year)) return false
  const n = Number(year)
  return n >= REPORT_CATALOG_YEAR_MIN && n <= REPORT_CATALOG_YEAR_MAX
}

/** Registry upsert: use incoming reportYear when it is a valid year. */
export function mergeReportYearFromPipeline(
  existing: string | null | undefined,
  incoming: string | null | undefined
): string | undefined {
  const inc = trimStr(incoming ?? null)
  if (!inc || !isValidReportCatalogYear(inc)) {
    return trimStr(existing ?? null) ?? undefined
  }
  return inc
}

/** Last path segment of a report URL, lowercased (e.g. `annual-report-2024.pdf`). */
export function pdfBasenameFromUrl(
  raw: string | null | undefined
): string | null {
  const value = trimStr(raw)
  if (!value) return null
  try {
    const pathname = decodeURIComponent(new URL(value).pathname)
    const segment = pathname.split('/').filter(Boolean).pop()
    if (!segment || segment.length < 3) return null
    return segment.toLowerCase()
  } catch {
    return null
  }
}

/** Legacy GCS object names: `company_q1234567_2020_original-file-name.pdf`. */
const LEGACY_GCS_BASENAME_PREFIX = /^[a-z0-9_]+_q\d+_\d{4}_/i

/** File name after stripping a legacy GCS prefix (may equal the full basename). */
export function storageBasenameTailForMatch(storageBasename: string): string {
  const tail = storageBasename.replace(LEGACY_GCS_BASENAME_PREFIX, '')
  return tail.length >= 3 ? tail : storageBasename
}

/**
 * Whether a web PDF name and a storage PDF name refer to the same file.
 * Exact match, or storage name is `Company_Q{id}_{year}_` + web file name.
 */
export function pdfBasenamesMatchForIdentityLink(
  webBasename: string,
  storageBasename: string
): boolean {
  if (webBasename === storageBasename) return true
  return webBasename === storageBasenameTailForMatch(storageBasename)
}

const REPORT_YEAR_TOKEN = /^(200\d|201\d|202[0-6])$/

/**
 * Latest plausible publication year in the PDF file name (last URL path segment only).
 * When several years appear in the basename, returns the highest (2000–2026).
 */
export function parseReportYearFromUrl(
  raw: string | null | undefined
): string | null {
  const basename = pdfBasenameFromUrl(raw)
  if (!basename) return null

  const years: number[] = []
  for (const token of basename.split(/[^0-9]+/)) {
    if (!REPORT_YEAR_TOKEN.test(token)) continue
    const year = Number(token)
    if (year >= REPORT_CATALOG_YEAR_MIN && year <= REPORT_CATALOG_YEAR_MAX) {
      years.push(year)
    }
  }
  if (years.length === 0) return null
  return String(Math.max(...years))
}

export function webUrlsForBasenameMatch(
  row: Pick<RegistryReportIdentityRow, 'url' | 'sourceUrl'>
): string[] {
  const urls: string[] = []
  const primary = trimStr(row.url)
  const source = trimStr(row.sourceUrl)
  if (primary && !isStorageUrl(primary)) urls.push(primary)
  if (source && !isStorageUrl(source) && !urls.includes(source))
    urls.push(source)
  return urls
}

export function storageUrlsForBasenameMatch(
  row: Pick<RegistryReportIdentityRow, 'url' | 's3Url'>
): string[] {
  const urls: string[] = []
  const s3 = trimStr(row.s3Url)
  const primary = trimStr(row.url)
  if (s3) urls.push(s3)
  if (primary && isStorageUrl(primary) && !urls.includes(primary)) {
    urls.push(primary)
  }
  return urls
}

export interface ReportIdentityUnionFind {
  find(id: string): string
  union(a: string, b: string): void
}

/** Links rows when a web/source URL and a storage URL share the same PDF file name and company. */
export function linkReportRowsByPdfBasename(
  rows: RegistryReportIdentityRow[],
  dsu: ReportIdentityUnionFind
): void {
  const webByKey = new Map<string, string[]>()
  const storageByKey = new Map<string, string[]>()

  for (const row of rows) {
    const wikidataId = trimStr(row.wikidataId)
    if (!wikidataId) continue

    for (const url of webUrlsForBasenameMatch(row)) {
      const basename = pdfBasenameFromUrl(url)
      if (!basename) continue
      const key = `${wikidataId}\0${basename}`
      const ids = webByKey.get(key)
      if (ids) ids.push(row.id)
      else webByKey.set(key, [row.id])
    }

    for (const url of storageUrlsForBasenameMatch(row)) {
      const basename = pdfBasenameFromUrl(url)
      if (!basename) continue
      const key = `${wikidataId}\0${basename}`
      const ids = storageByKey.get(key)
      if (ids) ids.push(row.id)
      else storageByKey.set(key, [row.id])
    }
  }

  for (const [key, storageIds] of storageByKey) {
    const webIds = webByKey.get(key)
    if (!webIds) continue
    for (const storageId of storageIds) {
      for (const webId of webIds) {
        if (storageId !== webId) dsu.union(storageId, webId)
      }
    }
  }

  const webEntriesByWikidata = new Map<
    string,
    { rowId: string; basename: string }[]
  >()
  const storageEntriesByWikidata = new Map<
    string,
    { rowId: string; basename: string }[]
  >()

  for (const row of rows) {
    const wikidataId = trimStr(row.wikidataId)
    if (!wikidataId) continue

    for (const url of webUrlsForBasenameMatch(row)) {
      const basename = pdfBasenameFromUrl(url)
      if (!basename) continue
      const list = webEntriesByWikidata.get(wikidataId)
      const entry = { rowId: row.id, basename }
      if (list) list.push(entry)
      else webEntriesByWikidata.set(wikidataId, [entry])
    }

    for (const url of storageUrlsForBasenameMatch(row)) {
      const basename = pdfBasenameFromUrl(url)
      if (!basename) continue
      const list = storageEntriesByWikidata.get(wikidataId)
      const entry = { rowId: row.id, basename }
      if (list) list.push(entry)
      else storageEntriesByWikidata.set(wikidataId, [entry])
    }
  }

  for (const [wikidataId, storageEntries] of storageEntriesByWikidata) {
    const webEntries = webEntriesByWikidata.get(wikidataId)
    if (!webEntries) continue

    for (const { rowId: storageId, basename: storageBase } of storageEntries) {
      for (const { rowId: webId, basename: webBase } of webEntries) {
        if (storageId === webId) continue
        if (pdfBasenamesMatchForIdentityLink(webBase, storageBase)) {
          dsu.union(storageId, webId)
        }
      }
    }
  }
}

/** Prefer catalog year from web URLs, then storage URLs, then the stored value. */
export function preferReportYearFromWebUrls(
  row: Pick<
    RegistryReportIdentityRow,
    'url' | 'sourceUrl' | 's3Url' | 'reportYear'
  >
): string | null {
  for (const url of webUrlsForBasenameMatch(row)) {
    const year = parseReportYearFromUrl(url)
    if (year) return year
  }
  for (const url of storageUrlsForBasenameMatch(row)) {
    const year = parseReportYearFromUrl(url)
    if (year) return year
  }
  return trimStr(row.reportYear)
}

export function numberOfIdentityFieldsInRow(
  row: RegistryReportIdentityRow
): number {
  return (['sha256', 's3Url', 'sourceUrl', 'url'] as const).filter((field) =>
    trimStr(row[field])
  ).length
}

// Prefers the row with the most identity fields filled in, since that's likely the most
// complete data. sha256 wins a tie (means we have a verified cached copy); id breaks any remaining ties.
export function pickRowToKeep(
  rows: RegistryReportIdentityRow[]
): RegistryReportIdentityRow {
  if (rows.length === 0) throw new Error('pickRowToKeep: empty rows')
  if (rows.length === 1) return rows[0]
  return [...rows].sort((a, b) => {
    const scoreDiff =
      numberOfIdentityFieldsInRow(b) - numberOfIdentityFieldsInRow(a)
    if (scoreDiff !== 0) return scoreDiff
    const aHasSha256 = trimStr(a.sha256) ? 1 : 0
    const bHasSha256 = trimStr(b.sha256) ? 1 : 0
    if (aHasSha256 !== bHasSha256) return bHasSha256 - aHasSha256
    return a.id.localeCompare(b.id)
  })[0]
}

// Nothing on rowToKeep is overwritten — only empty slots are filled.
export function copyMissingFields(
  rowToKeep: RegistryReportIdentityRow,
  rowToDelete: RegistryReportIdentityRow
): Partial<RegistryReportIdentityRow> {
  const patch: Partial<RegistryReportIdentityRow> = {}

  const fields = [
    'sha256',
    'sourceUrl',
    's3Url',
    's3Key',
    's3Bucket',
    'companyName',
    'wikidataId',
    'reportYear',
  ] as const

  for (const field of fields) {
    const keepValue = rowToKeep[field] as string | null
    const deleteValue = trimStr(rowToDelete[field] as string | null)
    const keepIsEmpty =
      field === 'companyName'
        ? isPlaceholderCompanyName(keepValue)
        : !trimStr(keepValue)
    const deleteIsPresent =
      field === 'companyName'
        ? !isPlaceholderCompanyName(deleteValue)
        : Boolean(deleteValue)

    if (keepIsEmpty && deleteIsPresent) {
      patch[field] = deleteValue as any
    }
  }

  // `url` is special: upgrade from storage link to web URL when possible, or
  // promote a rowToDelete storage link to `s3Url` if we don't have one yet.
  const keepUrl = trimStr(rowToKeep.url)
  const deleteUrl = trimStr(rowToDelete.url)

  if (deleteUrl) {
    const deleteUrlIsWebUrl =
      /^https?:\/\//i.test(deleteUrl) && !isStorageUrl(deleteUrl)
    const keepUrlOnlyHasStorageUrl = !keepUrl || isStorageUrl(keepUrl)

    if (deleteUrlIsWebUrl && keepUrlOnlyHasStorageUrl) {
      patch.url = deleteUrl
    } else if (isStorageUrl(deleteUrl) && !trimStr(rowToKeep.s3Url)) {
      patch.s3Url = deleteUrl
    }
  }

  return patch
}

// Cross-links are needed because the crawler and pipeline historically wrote the same web URL
// to different columns. Searching { url: sourceUrl } and { sourceUrl: url } catches either write order.
export function buildReportMatchConditions(input: {
  url: string
  sourceUrl?: string | null
  s3Url?: string | null
  sha256?: string | null
}): Prisma.ReportWhereInput[] {
  const sha256 = trimStr(input.sha256)
  const sourceUrl = trimStr(input.sourceUrl)
  const url = trimStr(input.url)
  const s3Url = trimStr(input.s3Url)

  const conditions: Prisma.ReportWhereInput[] = []

  if (sha256) conditions.push({ sha256 })
  if (sourceUrl) conditions.push({ sourceUrl })
  if (url) conditions.push({ url })
  if (s3Url) conditions.push({ s3Url })

  if (sourceUrl && sourceUrl !== url) conditions.push({ url: sourceUrl })
  if (url && url !== sourceUrl) conditions.push({ sourceUrl: url })

  return conditions
}
