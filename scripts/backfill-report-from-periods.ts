/**
 * Backfill `Report` registry rows from data already stored on `ReportingPeriod`.
 *
 * Each `ReportingPeriod` row can carry up to three identity fields pointing at the
 * underlying PDF document:
 *   - `reportSha256`  — content hash (strongest identity)
 *   - `reportS3Url`   — GCS/S3 cached copy
 *   - `reportURL`     — original web link (may be a storage URL on old rows)
 *
 * This script:
 *   1. Loads all periods that have at least one identity field set; skips the rest.
 *   2. Clusters periods that reference the same document (shared sha/S3/URL keys, then
 *      merge web-only vs GCS-only clusters for the same company when the PDF file name matches).
 *   3. For each cluster, derives the richest `Report` payload:
 *        url       = non-S3 reportURL if available, else reportS3Url
 *        sourceUrl = non-S3 reportURL (always stored when known)
 *        s3Url     = reportS3Url
 *        sha256    = reportSha256
 *        reportYear = year from PDF file name when present (2000–2026), else max data year in cluster
 *        wikidataId / companyName = from the company with the most periods in the cluster
 *   4. Calls `upsertReportInRegistry` for each cluster — this is the same multi-key
 *      dedup logic used at write time, so it safely merges with existing `Report` rows.
 *
 * Usage:
 *   npx tsx scripts/backfill-report-from-periods.ts --dry-run
 *   npx tsx scripts/backfill-report-from-periods.ts
 *   npx tsx scripts/backfill-report-from-periods.ts --emit-mapping=./backfill-mapping.csv
 *
 * Run against a staging clone first. The k8s job manifest is at
 * k8s/jobs/backfill-report-from-periods.yaml.
 */

import 'dotenv/config'
import { parseArgs } from 'node:util'
import { writeFileSync } from 'node:fs'

import { prisma } from '../src/lib/prisma'
import { registryService } from '../src/api/services/registryService'
import {
  isStorageUrl,
  parseReportYearFromUrl,
  pdfBasenameFromUrl,
  trimStr,
} from '../src/api/services/registryReportIdentity'
import { invalidateRegistryCache } from '../src/api/services/registryCache'
import { createServerCache, disconnectRedisCache } from '../src/createCache'

// ── Union-find ────────────────────────────────────────────────────────────────

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
}

function registerPeriodIdentity(
  owner: Map<string, string>,
  dsu: DisjointSet,
  periodId: string,
  key: string
) {
  const existing = owner.get(key)
  if (existing) dsu.union(periodId, existing)
  else owner.set(key, periodId)
}

function unionPeriodsByIdentityKeys(periods: PeriodRow[], dsu: DisjointSet) {
  const owner = new Map<string, string>()
  for (const p of periods) {
    const sha = trimStr(p.reportSha256)
    const s3 =
      trimStr(p.reportS3Url) ??
      (isStorageUrl(p.reportURL) ? trimStr(p.reportURL) : null)
    const url = trimStr(p.reportURL)

    if (sha) registerPeriodIdentity(owner, dsu, p.id, `sha:${sha}`)
    if (s3) registerPeriodIdentity(owner, dsu, p.id, `s3:${s3}`)
    if (url) registerPeriodIdentity(owner, dsu, p.id, `url:${url}`)
  }
}

interface ClusterMeta {
  root: string
  periods: PeriodRow[]
  wikidataId: string
  webUrl: string | null
  s3Url: string | null
  sha256: string | null
}

function shouldMergeComplementaryClusters(
  a: ClusterMeta,
  b: ClusterMeta
): boolean {
  const shaA = trimStr(a.sha256)
  const shaB = trimStr(b.sha256)
  if (shaA && shaB && shaA === shaB) return true

  const pairs: [string | null, string | null][] = [
    [a.webUrl, b.s3Url],
    [b.webUrl, a.s3Url],
  ]
  for (const [web, s3] of pairs) {
    if (!web || !s3) continue
    const webBase = pdfBasenameFromUrl(web)
    const s3Base = pdfBasenameFromUrl(s3)
    if (webBase && s3Base && webBase === s3Base) return true
  }
  return false
}

function mergeComplementaryClusters(
  clusters: Map<string, PeriodRow[]>
): Map<string, PeriodRow[]> {
  const metas: ClusterMeta[] = []
  for (const [root, clusterPeriods] of clusters) {
    const { wikidataId } = dominantCompany(clusterPeriods)
    metas.push({
      root,
      periods: clusterPeriods,
      wikidataId,
      webUrl: bestWebUrl(clusterPeriods),
      s3Url: bestS3Url(clusterPeriods),
      sha256: bestSha256(clusterPeriods),
    })
  }

  const clusterDsu = new DisjointSet()
  for (const meta of metas) clusterDsu.find(meta.root)

  for (let i = 0; i < metas.length; i++) {
    for (let j = i + 1; j < metas.length; j++) {
      const a = metas[i]!
      const b = metas[j]!
      if (a.wikidataId !== b.wikidataId) continue
      if (shouldMergeComplementaryClusters(a, b)) {
        clusterDsu.union(a.root, b.root)
      }
    }
  }

  const merged = new Map<string, PeriodRow[]>()
  for (const meta of metas) {
    const mergedRoot = clusterDsu.find(meta.root)
    const list = merged.get(mergedRoot)
    if (list) list.push(...meta.periods)
    else merged.set(mergedRoot, [...meta.periods])
  }
  return merged
}

// ── Period row type ───────────────────────────────────────────────────────────

interface PeriodRow {
  id: string
  year: string
  reportURL: string | null
  reportS3Url: string | null
  reportSha256: string | null
  companyId: string
  company: {
    name: string
  }
}

// ── Cluster → Report payload ──────────────────────────────────────────────────

/**
 * Best non-S3 web URL from a group of periods, or null if none exists.
 */
function bestWebUrl(periods: PeriodRow[]): string | null {
  for (const p of periods) {
    const u = trimStr(p.reportURL)
    if (u && !isStorageUrl(u)) return u
  }
  return null
}

/**
 * Best S3/CDN URL from a group of periods, or null if none exists.
 */
function bestS3Url(periods: PeriodRow[]): string | null {
  for (const p of periods) {
    const u = trimStr(p.reportS3Url)
    if (u) return u
    // Also treat reportURL as s3Url when it looks like a storage URL
    const ru = trimStr(p.reportURL)
    if (ru && isStorageUrl(ru)) return ru
  }
  return null
}

/**
 * Best sha256 from a group of periods, or null if none exists.
 */
function bestSha256(periods: PeriodRow[]): string | null {
  for (const p of periods) {
    const h = trimStr(p.reportSha256)
    if (h) return h
  }
  return null
}

/** Max data year across periods in the cluster (fallback for catalog `reportYear`). */
function maxDataYear(periods: PeriodRow[]): string | null {
  let best: string | null = null
  for (const p of periods) {
    const y = trimStr(p.year)
    if (y && (!best || y > best)) best = y
  }
  return best
}

function resolveReportYear(
  periods: PeriodRow[],
  webUrl: string | null,
  s3Url: string | null
): string | undefined {
  const fromFileName =
    parseReportYearFromUrl(s3Url) ?? parseReportYearFromUrl(webUrl)
  const fromMaxDataYear = maxDataYear(periods)

  if (fromFileName && fromMaxDataYear && fromFileName !== fromMaxDataYear) {
    console.warn(
      `  [year] file name year ${fromFileName} differs from max period data year ${fromMaxDataYear} (periods: ${periods.map((p) => p.id).join(', ')})`
    )
  }

  const year = fromFileName ?? fromMaxDataYear
  return year ?? undefined
}

/**
 * Company identity (wikidataId + name) for the cluster: uses the company that owns the
 * most periods in the cluster. Tie-break: lexicographically smallest wikidataId.
 */
function dominantCompany(periods: PeriodRow[]): {
  wikidataId: string
  companyName: string
} {
  const counts = new Map<string, { count: number; name: string }>()
  for (const p of periods) {
    const entry = counts.get(p.companyId)
    if (entry) entry.count++
    else counts.set(p.companyId, { count: 1, name: p.company.name })
  }
  let best = { wikidataId: '', companyName: '', count: 0 }
  for (const [wid, { count, name }] of counts) {
    if (count > best.count || (count === best.count && wid < best.wikidataId)) {
      best = { wikidataId: wid, companyName: name, count }
    }
  }
  return { wikidataId: best.wikidataId, companyName: best.companyName }
}

// ── Main ──────────────────────────────────────────────────────────────────────

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
    // 1. Load all periods that have at least one identity field.
    const periods = (await prisma.reportingPeriod.findMany({
      where: {
        OR: [
          { reportURL: { not: null } },
          { reportS3Url: { not: null } },
          { reportSha256: { not: null } },
        ],
      },
      select: {
        id: true,
        year: true,
        reportURL: true,
        reportS3Url: true,
        reportSha256: true,
        companyId: true,
        company: { select: { name: true } },
      },
      orderBy: { id: 'asc' },
    })) as PeriodRow[]

    const totalPeriods = await prisma.reportingPeriod.count()
    const skipped = totalPeriods - periods.length

    console.log(
      `Loaded ${periods.length} period(s) with at least one identity field set; skipped ${skipped} with no identity.`
    )

    if (periods.length === 0) {
      console.log('Nothing to backfill.')
      return
    }

    // 2. Cluster periods by document identity, then merge complementary web/GCS clusters.
    const dsu = new DisjointSet()
    unionPeriodsByIdentityKeys(periods, dsu)

    let clusters = new Map<string, PeriodRow[]>()
    for (const p of periods) {
      const root = dsu.find(p.id)
      const list = clusters.get(root)
      if (list) list.push(p)
      else clusters.set(root, [p])
    }

    const clustersBeforeMerge = clusters.size
    clusters = mergeComplementaryClusters(clusters)
    if (clusters.size < clustersBeforeMerge) {
      console.log(
        `Merged complementary clusters: ${clustersBeforeMerge} → ${clusters.size} document cluster(s).`
      )
    } else {
      console.log(`Grouped into ${clusters.size} document cluster(s).`)
    }

    // 3. Upsert one Report per cluster.
    let created = 0
    let updated = 0
    let errors = 0
    const mappingRows: string[] = [
      'period_ids,wikidataId,url,reportYear,action',
    ]

    for (const clusterPeriods of clusters.values()) {
      const webUrl = bestWebUrl(clusterPeriods)
      const s3Url = bestS3Url(clusterPeriods)
      const sha256 = bestSha256(clusterPeriods)
      const year = resolveReportYear(clusterPeriods, webUrl, s3Url)
      const { wikidataId, companyName } = dominantCompany(clusterPeriods)

      // `url` is required by upsertReportInRegistry — must always be set.
      const url = webUrl ?? s3Url
      if (!url) {
        // Shouldn't happen since we filtered for at least one identity field, but guard anyway.
        console.warn(
          `  [skip] cluster for company ${wikidataId} has no usable URL (periods: ${clusterPeriods.map((p) => p.id).join(', ')})`
        )
        continue
      }

      const payload = {
        companyName,
        wikidataId,
        reportYear: year ?? undefined,
        url,
        sourceUrl: webUrl ?? null,
        s3Url: s3Url ?? null,
        sha256: sha256 ?? null,
      }

      if (
        clusterPeriods.length > 1 &&
        new Set(clusterPeriods.map((p) => p.companyId)).size > 1
      ) {
        const companies = [
          ...new Set(clusterPeriods.map((p) => p.companyId)),
        ].join(', ')
        console.warn(
          `  [warn] cluster for url=${url} spans multiple companies (${companies}); using dominant company ${wikidataId}`
        )
      }

      if (dryRun) {
        console.log(
          `[dry-run] Would upsert Report: url=${url.slice(0, 80)} sourceUrl=${payload.sourceUrl?.slice(0, 60) ?? '—'} s3Url=${payload.s3Url?.slice(0, 60) ?? '—'} year=${year ?? '—'} company=${wikidataId}`
        )
        mappingRows.push(
          `"${clusterPeriods.map((p) => p.id).join('|')}",${wikidataId},${url},${year ?? ''},dry-run`
        )
        created++ // count as "would create/update"
        continue
      }

      try {
        await registryService.upsertReportInRegistry(payload)
        updated++
        mappingRows.push(
          `"${clusterPeriods.map((p) => p.id).join('|')}",${wikidataId},${url},${year ?? ''},upserted`
        )
      } catch (err) {
        errors++
        console.error(
          `  [error] Failed to upsert Report for url=${url} company=${wikidataId}:`,
          err
        )
        mappingRows.push(
          `"${clusterPeriods.map((p) => p.id).join('|')}",${wikidataId},${url},${year ?? ''},error`
        )
      }
    }

    console.log(
      dryRun
        ? `[dry-run] Would upsert ${created} Report row(s) (create or merge).`
        : `Upserted ${updated} Report row(s)${errors > 0 ? `; ${errors} error(s) — check output above` : '.'}`
    )

    if (!dryRun) {
      const registryCache = createServerCache({ maxAge: 24 * 60 * 60 * 1000 })
      await invalidateRegistryCache(registryCache, console)
      console.log('Invalidated registry Redis cache.')
    }

    if (mappingPath) {
      if (dryRun) {
        console.log(
          'Skipping --emit-mapping in dry-run (re-run without --dry-run to write CSV).'
        )
      } else {
        writeFileSync(mappingPath, `${mappingRows.join('\n')}\n`, 'utf8')
        console.log(`Wrote mapping CSV: ${mappingPath}`)
      }
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
