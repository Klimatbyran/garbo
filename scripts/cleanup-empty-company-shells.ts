/**
 * Find (and optionally delete) empty company shells left after pipeline
 * create-then-relink — name-only rows with no periods, identifiers, profile
 * fields, or related records.
 *
 * Pipeline never auto-deletes. This script is manual:
 *   npm run cleanup-empty-company-shells              # dry-run (default)
 *   npm run cleanup-empty-company-shells -- --json=./empty-shells.json
 *   npm run cleanup-empty-company-shells -- --csv=./empty-shells.csv
 *   npm run cleanup-empty-company-shells -- --apply
 *   npm run cleanup-empty-company-shells -- --limit=50
 */

import 'dotenv/config'
import { parseArgs } from 'node:util'
import { writeFileSync } from 'node:fs'

import { prisma } from '../src/lib/prisma'
import {
  explainDisposableCompanyShell,
  type DisposableCompanyShellSnapshot,
} from '../src/lib/disposableCompanyShell'
import {
  companyShellSelect,
  toSnapshot,
} from '../src/lib/loadDisposableCompanyShellSnapshot'
import { companyService } from '../src/api/services/companyService'
import { redisCache } from '../src/lib/redisCacheSingleton'

function parsePositiveLimit(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined
  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(
      `Invalid --limit=${raw}. Use a positive integer (e.g. --limit=50).`
    )
  }
  return parsed
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

async function loadAllShellCandidates(
  limit?: number
): Promise<DisposableCompanyShellSnapshot[]> {
  const disposable: DisposableCompanyShellSnapshot[] = []
  const pageSize = 200
  let skip = 0

  while (limit === undefined || disposable.length < limit) {
    const companies = await prisma.company.findMany({
      where: {
        wikidataId: null,
        reportingPeriods: { none: {} },
      },
      select: companyShellSelect,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
      skip,
      take: pageSize,
    })
    if (companies.length === 0) break

    const activeRuns = await prisma.reportRun.groupBy({
      by: ['companyId'],
      where: {
        status: 'running',
        companyId: { in: companies.map((company) => company.id) },
      },
      _count: { _all: true },
    })
    const activeByCompanyId = new Map(
      activeRuns
        .filter((row) => row.companyId)
        .map((row) => [row.companyId as string, row._count._all])
    )

    for (const company of companies) {
      const snapshot = toSnapshot(
        company,
        activeByCompanyId.get(company.id) ?? 0
      )
      if (!explainDisposableCompanyShell(snapshot).disposable) continue
      disposable.push(snapshot)
      if (limit !== undefined && disposable.length >= limit) break
    }

    skip += companies.length
    if (companies.length < pageSize) break
  }

  return disposable
}

function toCsv(rows: DisposableCompanyShellSnapshot[]): string {
  const header =
    'company_id,company_name,lei,wikidata_id,reporting_period_count,company_report_count,active_report_run_count'
  const lines = rows.map((row) =>
    [
      row.id,
      escapeCsvField(row.name),
      row.lei ?? '',
      row.wikidataId ?? '',
      String(row.reportingPeriodCount),
      String(row.companyReports.length),
      String(row.activeReportRunCount),
    ].join(',')
  )
  return [header, ...lines].join('\n')
}

async function main() {
  const { values } = parseArgs({
    options: {
      json: { type: 'string' },
      csv: { type: 'string' },
      apply: { type: 'boolean', default: false },
      limit: { type: 'string' },
    },
    allowPositionals: false,
  })

  const limit = parsePositiveLimit(values.limit)
  const apply = Boolean(values.apply)

  const rows = await loadAllShellCandidates(limit)

  console.log('Empty company shell cleanup')
  console.log('===========================')
  console.log(`Disposable shells: ${rows.length}`)
  console.log(`Mode: ${apply ? 'APPLY (delete)' : 'dry-run'}`)
  console.log(
    'Note: pipeline never auto-deletes; --apply is manual opt-in only.'
  )
  console.log('')

  for (const row of rows) {
    console.log(`  ${row.id}  ${row.name}`)
    console.log(
      `    lei=${row.lei ?? '—'}  wikidata=${row.wikidataId ?? '—'}  ` +
        `periods=${row.reportingPeriodCount}  reports=${row.companyReports.length}`
    )
  }

  if (values.json) {
    writeFileSync(values.json, JSON.stringify(rows, null, 2), 'utf8')
    console.log(`\nWrote JSON report to ${values.json}`)
  }

  if (values.csv) {
    writeFileSync(values.csv, toCsv(rows), 'utf8')
    console.log(`\nWrote CSV report to ${values.csv}`)
  }

  if (!apply) {
    console.log(
      '\nDry-run only. Re-run with --apply to delete these companies.'
    )
    return
  }

  let deleted = 0
  let failed = 0
  for (const row of rows) {
    const snapshot = await prisma.company.findUnique({
      where: { id: row.id },
      select: companyShellSelect,
    })
    if (!snapshot) {
      console.log(`  [skip] ${row.id} already gone`)
      continue
    }
    const activeReportRunCount = await prisma.reportRun.count({
      where: { companyId: row.id, status: 'running' },
    })
    const verdict = explainDisposableCompanyShell(
      toSnapshot(snapshot, activeReportRunCount)
    )
    if (!verdict.disposable) {
      console.log(
        `  [skip] ${row.id} no longer disposable (${verdict.reasons.join(', ')})`
      )
      continue
    }

    try {
      await companyService.deleteCompany(row.id)
      deleted += 1
      console.log(`  [deleted] ${row.id}  ${row.name}`)
    } catch (error) {
      failed += 1
      const message = error instanceof Error ? error.message : String(error)
      console.error(`  [error] ${row.id}: ${message}`)
    }
  }

  if (deleted > 0) {
    redisCache.clear()
  }

  console.log(`\nDeleted ${deleted}; failed ${failed}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
