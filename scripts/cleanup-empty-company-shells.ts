/**
 * Find (and optionally delete) empty company shells left after pipeline
 * create-then-relink — name-only rows with no periods, Wikidata, LEI, or
 * registry-linked reports.
 *
 * Usage:
 *   npm run cleanup-empty-company-shells
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
import { companyService } from '../src/api/services/companyService'

type ShellRow = DisposableCompanyShellSnapshot & {
  reasons: string[]
}

async function loadAllShellCandidates(
  limit?: number
): Promise<DisposableCompanyShellSnapshot[]> {
  const companies = await prisma.company.findMany({
    where: {
      wikidataId: null,
      reportingPeriods: { none: {} },
    },
    select: {
      id: true,
      name: true,
      wikidataId: true,
      lei: true,
      _count: { select: { reportingPeriods: true } },
      companyReports: { select: { registryReportId: true } },
      identifiers: { select: { type: true, value: true } },
    },
    orderBy: { name: 'asc' },
    ...(limit && limit > 0 ? { take: limit * 5 } : {}),
  })

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

  const snapshots = companies.map((company) => ({
    id: company.id,
    name: company.name,
    wikidataId: company.wikidataId,
    lei: company.lei,
    reportingPeriodCount: company._count.reportingPeriods,
    companyReports: company.companyReports,
    identifiers: company.identifiers,
    activeReportRunCount: activeByCompanyId.get(company.id) ?? 0,
  }))

  const disposable = snapshots.filter(
    (snapshot) => explainDisposableCompanyShell(snapshot).disposable
  )

  if (limit && limit > 0) return disposable.slice(0, limit)
  return disposable
}

function toCsv(rows: ShellRow[]): string {
  const header =
    'company_id,company_name,lei,wikidata_id,reporting_period_count,company_report_count,active_report_run_count,reasons'
  const lines = rows.map((row) =>
    [
      row.id,
      JSON.stringify(row.name),
      row.lei ?? '',
      row.wikidataId ?? '',
      row.reportingPeriodCount,
      row.companyReports.length,
      row.activeReportRunCount,
      JSON.stringify(row.reasons.join('|')),
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

  const limit = values.limit ? Number(values.limit) : undefined
  const apply = Boolean(values.apply)

  const disposable = await loadAllShellCandidates(
    limit && Number.isFinite(limit) ? limit : undefined
  )

  const rows: ShellRow[] = disposable.map((snapshot) => ({
    ...snapshot,
    reasons: [],
  }))

  console.log('Empty company shell cleanup')
  console.log('===========================')
  console.log(`Disposable shells: ${rows.length}`)
  console.log(`Mode: ${apply ? 'APPLY (delete)' : 'dry-run'}`)
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
    // Re-check immediately before delete in case data changed.
    const snapshot = await prisma.company.findUnique({
      where: { id: row.id },
      select: {
        id: true,
        name: true,
        wikidataId: true,
        lei: true,
        _count: { select: { reportingPeriods: true } },
        companyReports: { select: { registryReportId: true } },
        identifiers: { select: { type: true, value: true } },
      },
    })
    if (!snapshot) {
      console.log(`  [skip] ${row.id} already gone`)
      continue
    }
    const activeReportRunCount = await prisma.reportRun.count({
      where: { companyId: row.id, status: 'running' },
    })
    const verdict = explainDisposableCompanyShell({
      id: snapshot.id,
      name: snapshot.name,
      wikidataId: snapshot.wikidataId,
      lei: snapshot.lei,
      reportingPeriodCount: snapshot._count.reportingPeriods,
      companyReports: snapshot.companyReports,
      identifiers: snapshot.identifiers,
      activeReportRunCount,
    })
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
