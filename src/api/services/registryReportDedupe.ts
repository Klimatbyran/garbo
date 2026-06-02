import {
  copyMissingFields,
  linkReportRowsByPdfBasename,
  pickRowToKeep,
  preferReportYearFromWebUrls,
  trimStr,
  type RegistryReportIdentityRow,
} from './registryReportIdentity'

class DisjointSet {
  private readonly parent = new Map<string, string>()

  find(x: string): string {
    if (!this.parent.has(x)) this.parent.set(x, x)
    let p = this.parent.get(x)!
    if (p !== x) {
      p = this.find(p)
      this.parent.set(x, p)
    }
    return p
  }

  union(a: string, b: string) {
    const ra = this.find(a)
    const rb = this.find(b)
    if (ra === rb) return
    if (ra.localeCompare(rb) < 0) this.parent.set(rb, ra)
    else this.parent.set(ra, rb)
  }

  unionAll(ids: string[]) {
    const uniq = [...new Set(ids)]
    if (uniq.length < 2) return
    const head = uniq[0]!
    for (let i = 1; i < uniq.length; i++) this.union(head, uniq[i]!)
  }
}

function addToIndex(map: Map<string, Set<string>>, key: string, id: string) {
  let set = map.get(key)
  if (!set) {
    set = new Set()
    map.set(key, set)
  }
  set.add(id)
}

/** Groups of report ids (size ≥ 2) that should be merged into one row. */
export function findDuplicateReportGroups(
  rows: RegistryReportIdentityRow[]
): string[][] {
  const dsu = new DisjointSet()
  const byS3 = new Map<string, Set<string>>()
  const bySource = new Map<string, Set<string>>()
  const bySha = new Map<string, Set<string>>()
  const byUrl = new Map<string, Set<string>>()

  for (const r of rows) {
    const s3 = trimStr(r.s3Url)
    const su = trimStr(r.sourceUrl)
    const sh = trimStr(r.sha256)
    const u = trimStr(r.url)
    if (s3) addToIndex(byS3, s3, r.id)
    if (su) addToIndex(bySource, su, r.id)
    if (sh) addToIndex(bySha, sh, r.id)
    if (u) addToIndex(byUrl, u, r.id)
  }

  for (const ids of byS3.values()) dsu.unionAll([...ids])
  for (const ids of bySource.values()) dsu.unionAll([...ids])
  for (const ids of bySha.values()) dsu.unionAll([...ids])
  for (const ids of byUrl.values()) dsu.unionAll([...ids])

  for (const r of rows) {
    const u = trimStr(r.url)
    if (u) {
      const linked = bySource.get(u)
      if (linked) {
        for (const oid of linked) {
          if (oid !== r.id) dsu.union(r.id, oid)
        }
      }
    }
    const su = trimStr(r.sourceUrl)
    if (su) {
      const linked = byUrl.get(su)
      if (linked) {
        for (const oid of linked) {
          if (oid !== r.id) dsu.union(r.id, oid)
        }
      }
    }
  }

  linkReportRowsByPdfBasename(rows, dsu)

  const rootToIds = new Map<string, string[]>()
  for (const r of rows) {
    const root = dsu.find(r.id)
    const list = rootToIds.get(root)
    if (list) list.push(r.id)
    else rootToIds.set(root, [r.id])
  }

  return [...rootToIds.values()].filter((ids) => ids.length > 1)
}

export function mergeDuplicateReportRows(
  rows: RegistryReportIdentityRow[]
): RegistryReportIdentityRow {
  if (rows.length < 2) {
    throw new Error('mergeDuplicateReportRows: need at least two rows')
  }

  const rowToKeep = pickRowToKeep(rows)
  const rowsToDelete = rows.filter((r) => r.id !== rowToKeep.id)
  const merged: RegistryReportIdentityRow = { ...rowToKeep }

  for (const row of rowsToDelete) {
    Object.assign(merged, copyMissingFields(merged, row))
  }

  const yearFromWeb = preferReportYearFromWebUrls(merged)
  if (yearFromWeb) merged.reportYear = yearFromWeb

  return merged
}
