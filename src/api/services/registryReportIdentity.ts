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

const STORAGE_URL_PATTERNS = [
  'storage.googleapis.com',
]

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

export function numberOfIdentityFieldsInRow(row: RegistryReportIdentityRow): number {
  return (['sha256', 's3Url', 'sourceUrl', 'url'] as const).filter(
    (field) => trimStr(row[field])
  ).length
}

// Prefers the row with the most identity fields filled in, since that's likely the most
// complete data. sha256 wins a tie (means we have a verified cached copy); id breaks any remaining ties.
export function pickRowToKeep(rows: RegistryReportIdentityRow[]): RegistryReportIdentityRow {
  if (rows.length === 0) throw new Error('pickRowToKeep: empty rows')
  if (rows.length === 1) return rows[0]
  return [...rows].sort((a, b) => {
    const scoreDiff = numberOfIdentityFieldsInRow(b) - numberOfIdentityFieldsInRow(a)
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
    'sha256', 'sourceUrl', 's3Url', 's3Key', 's3Bucket',
    'companyName', 'wikidataId', 'reportYear',
  ] as const

  for (const field of fields) {
    if (!trimStr(rowToKeep[field] as string | null) && trimStr(rowToDelete[field] as string | null)) {
      patch[field] = trimStr(rowToDelete[field] as string | null) as any
    }
  }

  // `url` is special: upgrade from storage link to web URL when possible, or
  // promote a rowToDelete storage link to `s3Url` if we don't have one yet.
  const keepUrl = trimStr(rowToKeep.url)
  const deleteUrl = trimStr(rowToDelete.url)

  if (deleteUrl) {
    const deleteUrlIsWebUrl = /^https?:\/\//i.test(deleteUrl) && !isStorageUrl(deleteUrl)
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
