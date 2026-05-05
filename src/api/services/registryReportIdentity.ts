import { Prisma } from '@prisma/client'

/**
 * `Report` row shape for survivor / merge helpers. Explicit so callers (including `scripts/`)
 * stay typed when the generated `@prisma/client` `Report` type lags `schema.prisma` (e.g. before
 * `npx prisma generate`).
 */
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

/** Heuristic: CDN / object storage URLs that should live in `s3Url`, not as the primary `url`. */
export function isLikelyStoredObjectUrl(raw: string | null | undefined): boolean {
  if (typeof raw !== 'string' || !raw.trim()) return false
  const s = raw.trim().toLowerCase()
  return (
    s.includes('amazonaws.com') ||
    s.includes('digitaloceanspaces.com') ||
    s.includes('storage.googleapis.com') ||
    s.includes('.r2.') ||
    s.includes('minio') ||
    s.includes('blob.core.windows.net')
  )
}

export function trimStr(s: string | null | undefined): string | null {
  if (typeof s !== 'string') return null
  const t = s.trim()
  return t.length ? t : null
}

export function identityScore(
  r: Pick<
    RegistryReportIdentityRow,
    'sha256' | 's3Url' | 'sourceUrl' | 'url'
  >
): number {
  let n = 0
  if (trimStr(r.sha256)) n++
  if (trimStr(r.s3Url)) n++
  if (trimStr(r.sourceUrl)) n++
  if (trimStr(r.url)) n++
  return n
}

/** Survivor = richest identity; tie-break: has sha256, then lexicographically smallest id (stable). */
export function pickSurvivorReport(
  rows: RegistryReportIdentityRow[]
): RegistryReportIdentityRow {
  if (rows.length === 0) {
    throw new Error('pickSurvivorReport: empty rows')
  }
  if (rows.length === 1) return rows[0]
  return [...rows].sort((a, b) => {
    const ds = identityScore(b) - identityScore(a)
    if (ds !== 0) return ds
    const ha = trimStr(a.sha256) ? 1 : 0
    const hb = trimStr(b.sha256) ? 1 : 0
    if (hb !== ha) return hb - ha
    return a.id.localeCompare(b.id)
  })[0]
}

/** Null-coalescing merge from donor onto target (for duplicate `Report` rows). */
export function mergeNullReportFields(
  target: RegistryReportIdentityRow,
  donor: RegistryReportIdentityRow
): Partial<RegistryReportIdentityRow> {
  const patch: Partial<RegistryReportIdentityRow> = {}
  if (!trimStr(target.sha256) && trimStr(donor.sha256)) patch.sha256 = trimStr(donor.sha256)
  if (!trimStr(target.sourceUrl) && trimStr(donor.sourceUrl))
    patch.sourceUrl = trimStr(donor.sourceUrl)
  if (!trimStr(target.s3Url) && trimStr(donor.s3Url)) patch.s3Url = trimStr(donor.s3Url)
  if (!trimStr(target.s3Key) && trimStr(donor.s3Key)) patch.s3Key = trimStr(donor.s3Key)
  if (!trimStr(target.s3Bucket) && trimStr(donor.s3Bucket))
    patch.s3Bucket = trimStr(donor.s3Bucket)
  if (!trimStr(target.companyName) && trimStr(donor.companyName))
    patch.companyName = trimStr(donor.companyName)
  if (!trimStr(target.wikidataId) && trimStr(donor.wikidataId))
    patch.wikidataId = trimStr(donor.wikidataId)
  if (!trimStr(target.reportYear) && trimStr(donor.reportYear))
    patch.reportYear = trimStr(donor.reportYear)

  const tUrl = trimStr(target.url)
  const dUrl = trimStr(donor.url)
  if (dUrl) {
    if (
      /^https?:\/\//i.test(dUrl) &&
      !isLikelyStoredObjectUrl(dUrl) &&
      (!tUrl || isLikelyStoredObjectUrl(tUrl))
    ) {
      patch.url = dUrl
    } else if (isLikelyStoredObjectUrl(dUrl) && !trimStr(target.s3Url)) {
      patch.s3Url = dUrl
    }
  }
  return patch
}

export function buildReportLookupOr(
  input: {
    url: string
    sourceUrl?: string | null
    s3Url?: string | null
    sha256?: string | null
  }
): Prisma.ReportWhereInput[] {
  const or: Prisma.ReportWhereInput[] = []
  const sh = trimStr(input.sha256)
  const su = trimStr(input.sourceUrl)
  const u = trimStr(input.url)
  const s3 = trimStr(input.s3Url)
  if (sh) or.push({ sha256: sh })
  if (su) or.push({ sourceUrl: su })
  if (u) or.push({ url: u })
  if (s3) or.push({ s3Url: s3 })
  return or
}
