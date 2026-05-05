/**
 * Merge duplicate `Report` rows that share the same non-null `s3Url` (required before
 * applying the partial unique index in migration `20260504120000_report_s3url_partial_unique`).
 *
 * Survivor selection and null-coalescing match `registryService.upsertReportInRegistry`.
 *
 * Usage:
 *   npx tsx scripts/dedupe-report-registry.ts --dry-run
 *   npx tsx scripts/dedupe-report-registry.ts --emit-mapping=./report-dedupe-mapping.csv
 */

import 'dotenv/config'
import { parseArgs } from 'node:util'
import { writeFileSync } from 'node:fs'

import type { Prisma } from '@prisma/client'
import { prisma } from '../src/lib/prisma'
import {
  mergeNullReportFields,
  pickSurvivorReport,
  type RegistryReportIdentityRow,
} from '../src/api/services/registryReportIdentity'

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
    console.log(
      `[dry-run] Would merge ${rows.length} rows (s3Url=${merged.s3Url?.slice(0, 80)}…) → survivor ${survivor.id}, delete ${losers.map((l) => l.id).join(', ')}`
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

  const dupes = await prisma.$queryRaw<{ s3Url: string }[]>`
    SELECT "s3Url"
    FROM "Report"
    WHERE "s3Url" IS NOT NULL
    GROUP BY "s3Url"
    HAVING COUNT(*) > 1
  `

  if (dupes.length === 0) {
    console.log('No duplicate non-null s3Url groups found.')
    await prisma.$disconnect()
    return
  }

  console.log(`Found ${dupes.length} duplicate s3Url group(s).`)

  const allMapping: string[] = ['loser_id,survivor_id']
  let totalDeleted = 0

  for (const { s3Url } of dupes) {
    const rows = await prisma.report.findMany({
      where: { s3Url },
      orderBy: { id: 'asc' },
    })
    const { deleted, mapping } = await mergeDuplicateGroup(
      rows as RegistryReportIdentityRow[],
      dryRun
    )
    totalDeleted += deleted
    allMapping.push(...mapping)
  }

  console.log(
    dryRun
      ? `[dry-run] Would delete ${totalDeleted} duplicate row(s).`
      : `Deleted ${totalDeleted} duplicate row(s); survivors updated.`
  )

  if (mappingPath && !dryRun) {
    writeFileSync(mappingPath, `${allMapping.join('\n')}\n`, 'utf8')
    console.log(`Wrote mapping CSV: ${mappingPath}`)
  } else if (mappingPath && dryRun) {
    console.log(
      'Skipping --emit-mapping in dry-run (re-run without --dry-run to write CSV).'
    )
  }

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
