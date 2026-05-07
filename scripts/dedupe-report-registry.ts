/**
 * Merge duplicate `Report` rows that describe the same underlying report. Rows are linked
 * into one group when they share any of:
 * - the same non-null `s3Url`
 * - the same non-null `sourceUrl`
 * - the same non-null `sha256`
 * - the same non-null `url`
 * - cross-link: row A's `url` equals row B's `sourceUrl` (e.g. crawler row keyed by `url`
 *   vs pipeline row with `sourceUrl` set to that report URL)
 *
 * This matches how `buildReportLookupOr` / `upsertReportInRegistry` can match rows, and
 * supports the partial unique index on `s3Url` (migration `20260504120000_report_s3url_partial_unique`).
 *
 * Survivor selection and null-coalescing match `registryService.upsertReportInRegistry`.
 *
 * Usage:
 *   npx tsx scripts/dedupe-report-registry.ts --dry-run
 *   npx tsx scripts/dedupe-report-registry.ts --emit-mapping=./report-dedupe-mapping.csv
 *
 * Non-dry runs always invalidate the registry Redis cache (same keys as the API) so the
 * Validate registry tab refetches from Postgres instead of serving a stale list.
 */

import 'dotenv/config'
import { parseArgs } from 'node:util'
import { writeFileSync } from 'node:fs'

import type { Prisma } from '@prisma/client'
import { prisma } from '../src/lib/prisma'
import { invalidateRegistryCache } from '../src/api/services/registryCache'
import { createServerCache, disconnectRedisCache } from '../src/createCache'
import {
  mergeNullReportFields,
  pickSurvivorReport,
  trimStr,
  type RegistryReportIdentityRow,
} from '../src/api/services/registryReportIdentity'

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
function findDuplicateComponents(
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

  // url on one row === sourceUrl on another (crawler vs pipeline)
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

  const rootToIds = new Map<string, string[]>()
  for (const r of rows) {
    const root = dsu.find(r.id)
    const list = rootToIds.get(root)
    if (list) list.push(r.id)
    else rootToIds.set(root, [r.id])
  }

  return [...rootToIds.values()].filter((ids) => ids.length > 1)
}

async function invalidateRegistryRedisCache() {
  const registryCache = createServerCache({ maxAge: 24 * 60 * 60 * 1000 })
  await invalidateRegistryCache(registryCache, console)
  console.log(
    'Invalidated registry Redis cache so GET /reports/registry reflects the DB.'
  )
}

async function mergeDuplicateGroup(
  rows: RegistryReportIdentityRow[],
  dryRun: boolean
) {
  if (rows.length < 2) return { merged: 0, deleted: 0, mapping: [] as string[] }

  const survivor = pickSurvivorReport(rows)
  const losers = rows.filter((r) => r.id !== survivor.id)
  const merged: RegistryReportIdentityRow = { ...survivor }
  for (const row of losers) {
    Object.assign(merged, mergeNullReportFields(merged, row))
  }

  const mapping: string[] = []
  for (const row of losers) {
    mapping.push(`${row.id},${survivor.id}`)
  }

  if (dryRun) {
    const preview = (s: string | null | undefined) =>
      s ? `${s.slice(0, 72)}${s.length > 72 ? '…' : ''}` : '—'
    console.log(
      `[dry-run] Would merge ${rows.length} rows → survivor ${survivor.id}, delete ${losers.map((l) => l.id).join(', ')}\n` +
        `          url=${preview(merged.url)} sourceUrl=${preview(merged.sourceUrl)} s3Url=${preview(merged.s3Url)}`
    )
    return { merged: 1, deleted: losers.length, mapping }
  }

  await prisma.$transaction(async (tx) => {
    for (const row of losers) {
      await tx.report.delete({ where: { id: row.id } })
    }
    await tx.report.update({
      where: { id: survivor.id },
      data: {
        companyName: merged.companyName ?? undefined,
        wikidataId: merged.wikidataId ?? undefined,
        reportYear: merged.reportYear ?? undefined,
        url: merged.url,
        sourceUrl: merged.sourceUrl ?? undefined,
        s3Url: merged.s3Url ?? undefined,
        s3Key: merged.s3Key ?? undefined,
        s3Bucket: merged.s3Bucket ?? undefined,
        sha256: merged.sha256 ?? undefined,
      } as Prisma.ReportUpdateInput,
    })
  })

  return { merged: 1, deleted: losers.length, mapping }
}

async function main() {
  const { values } = parseArgs({
    options: {
      'dry-run': { type: 'boolean', default: false },
      'emit-mapping': { type: 'string' },
    },
  })

  const dryRun = Boolean(values['dry-run'])
  const mappingPath = values['emit-mapping']

  try {
    const allRows = (await prisma.report.findMany({
      orderBy: { id: 'asc' },
    })) as RegistryReportIdentityRow[]

    const componentIdLists = findDuplicateComponents(allRows)
    const rowById = new Map(allRows.map((r) => [r.id, r]))

    if (componentIdLists.length === 0) {
      console.log(
        'No duplicate report identity groups found (same s3Url, sourceUrl, sha256, url, or url↔sourceUrl link).'
      )
      if (!dryRun) {
        await invalidateRegistryRedisCache()
      }
      return
    }

    console.log(`Found ${componentIdLists.length} duplicate group(s).`)

    const allMapping: string[] = ['loser_id,survivor_id']
    let totalDeleted = 0

    for (const ids of componentIdLists) {
      const rows = ids
        .map((id) => rowById.get(id))
        .filter((r): r is RegistryReportIdentityRow => Boolean(r))
        .sort((a, b) => a.id.localeCompare(b.id))

      if (rows.length < 2) continue

      const { deleted, mapping } = await mergeDuplicateGroup(rows, dryRun)
      totalDeleted += deleted
      allMapping.push(...mapping)
    }

    console.log(
      dryRun
        ? `[dry-run] Would delete ${totalDeleted} duplicate row(s).`
        : `Deleted ${totalDeleted} duplicate row(s); survivors updated.`
    )

    if (!dryRun) {
      await invalidateRegistryRedisCache()
    }

    if (mappingPath && !dryRun) {
      writeFileSync(mappingPath, `${allMapping.join('\n')}\n`, 'utf8')
      console.log(`Wrote mapping CSV: ${mappingPath}`)
    } else if (mappingPath && dryRun) {
      console.log(
        'Skipping --emit-mapping in dry-run (re-run without --dry-run to write CSV).'
      )
    }
  } finally {
    await disconnectRedisCache()
    await prisma.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
