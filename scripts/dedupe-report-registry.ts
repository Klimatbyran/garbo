/**
 * Merge duplicate `Report` rows that describe the same underlying report. Rows are linked
 * into one group when they share any of:
 * - the same non-null `s3Url`
 * - the same non-null `sourceUrl`
 * - the same non-null `sha256`
 * - the same non-null `url`
 * - cross-link: row A's `url` equals row B's `sourceUrl` (e.g. crawler row keyed by `url`
 *   vs pipeline row with `sourceUrl` set to that report URL)
 * - same `wikidataId` and matching PDF file name on web vs storage (exact or legacy GCS prefix)
 *
 * This matches how `buildReportMatchConditions` / `upsertReportInRegistry` can match rows, and
 * supports the partial unique index on `s3Url` (migration `20260504120000_report_s3url_partial_unique`).
 *
 * Row selection and null-coalescing match `registryService.upsertReportInRegistry`.
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
  findDuplicateReportGroups,
  mergeDuplicateReportRows,
} from '../src/api/services/registryReportDedupe'
import type { RegistryReportIdentityRow } from '../src/api/services/registryReportIdentity'

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

  const merged = mergeDuplicateReportRows(rows)
  const rowToKeep = rows.find((r) => r.id === merged.id)!
  const rowsToDelete = rows.filter((r) => r.id !== merged.id)

  const mapping: string[] = []
  for (const row of rowsToDelete) {
    mapping.push(`${row.id},${rowToKeep.id}`)
  }

  if (dryRun) {
    const preview = (s: string | null | undefined) =>
      s ? `${s.slice(0, 72)}${s.length > 72 ? '…' : ''}` : '—'
    console.log(
      `[dry-run] Would merge ${rows.length} rows → keep ${rowToKeep.id}, delete ${rowsToDelete.map((r) => r.id).join(', ')}\n` +
        `          url=${preview(merged.url)} sourceUrl=${preview(merged.sourceUrl)} s3Url=${preview(merged.s3Url)} reportYear=${merged.reportYear ?? '—'}`
    )
    return { merged: 1, deleted: rowsToDelete.length, mapping }
  }

  await prisma.$transaction(async (tx) => {
    for (const row of rowsToDelete) {
      await tx.report.delete({ where: { id: row.id } })
    }
    await tx.report.update({
      where: { id: rowToKeep.id },
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

  return { merged: 1, deleted: rowsToDelete.length, mapping }
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

    const componentIdLists = findDuplicateReportGroups(allRows)
    const rowById = new Map(allRows.map((r) => [r.id, r]))

    if (componentIdLists.length === 0) {
      console.log(
        'No duplicate report identity groups found (same s3Url, sourceUrl, sha256, url, url↔sourceUrl link, or matching PDF basename per company).'
      )
      if (!dryRun) {
        await invalidateRegistryRedisCache()
      }
      return
    }

    console.log(`Found ${componentIdLists.length} duplicate group(s).`)

    const allMapping: string[] = ['deleted_id,kept_id']
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
        : `Deleted ${totalDeleted} duplicate row(s); kept rows updated.`
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
