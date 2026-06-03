/**
 * Data migration: populate ReportingPeriod.companyReportId for all existing rows.
 *
 * Run AFTER:
 *   1. The PR 1 schema migration (adds CompanyReport table + nullable companyReportId column)
 *   2. scripts/backfill-report-from-periods.ts (0b) recommended — populates Report registry rows
 *
 * PR 1 linking policy (one shell per company):
 *   - Create/find a single CompanyReport per company pointing at that company's "latest" Report.
 *   - Link every unlinked period for that company to that CompanyReport.
 *   - Do not split by per-period reportURL/hash (comparison years often lack identity on the period row).
 *
 * "Latest" Report resolution (in order):
 *   1. Newest period-level Metadata.source that looks like an HTTP(S) URL (pipeline save URL).
 *   2. Else the Report registry row for this wikidataId with the highest reportYear (tie-break:
 *      most identity fields filled, then has sha256, then id — same as registry dedupe).
 *   3. Else a synthetic CompanyReport (registryReportId NULL) — rare if the company has no Report rows
 *      and no metadata URL.
 *
 * Follow-up PR 1b can insert validated periods under a separate CompanyReport (e.g. 2024 report)
 * once @@unique([companyReportId, year]) exists in PR 2. Reassign companyReportId later if needed.
 *
 * Usage:
 *   npx tsx scripts/link-periods-to-company-reports.ts --dry-run
 *   npx tsx scripts/link-periods-to-company-reports.ts
 *
 * Safe to re-run: already-linked periods (companyReportId IS NOT NULL) are skipped.
 */

import 'dotenv/config'
import { parseArgs } from 'node:util'

import { prisma } from '../src/lib/prisma'
import { registryService } from '../src/api/services/registryService'
import {
  isLikelyStoredObjectUrl,
  pickRowToKeep,
  trimStr,
  type RegistryReportIdentityRow,
} from '../src/api/services/registryReportIdentity'
import { disconnectRedisCache } from '../src/createCache'

type PeriodRow = {
  id: string
  year: string
  companyId: string
  reportURL: string | null
  reportS3Url: string | null
  reportSha256: string | null
  company: { name: string }
}

type LatestResolution =
  | { kind: 'metadata'; sourcePreview: string; registryReportId: string }
  | { kind: 'registry'; registryReportId: string; reportYear: string | null }
  | { kind: 'synthetic'; registryReportId: null }
  | { kind: 'metadata-dry-run'; sourcePreview: string }

function isHttpSource(source: string | null | undefined): boolean {
  const s = trimStr(source)
  return !!s && /^https?:\/\//i.test(s)
}

function bestWebUrl(reportURL: string | null): string | null {
  const u = trimStr(reportURL)
  return u && !isLikelyStoredObjectUrl(u) ? u : null
}

function bestS3Url(
  reportS3Url: string | null,
  reportURL: string | null
): string | null {
  const s3 = trimStr(reportS3Url)
  if (s3) return s3
  const u = trimStr(reportURL)
  return u && isLikelyStoredObjectUrl(u) ? u : null
}

function parseReportYear(reportYear: string | null | undefined): number | null {
  const y = trimStr(reportYear ?? null)
  if (!y || !/^\d{4}$/.test(y)) return null
  return Number(y)
}

function groupPeriodsByCompany(periods: PeriodRow[]): Map<string, PeriodRow[]> {
  const byCompany = new Map<string, PeriodRow[]>()
  for (const period of periods) {
    const list = byCompany.get(period.companyId) ?? []
    list.push(period)
    byCompany.set(period.companyId, list)
  }
  return byCompany
}

async function latestMetadataSourceForPeriods(
  periodIds: string[]
): Promise<string | null> {
  if (periodIds.length === 0) return null

  const rows = await prisma.metadata.findMany({
    where: {
      reportingPeriodId: { in: periodIds },
      source: { not: null },
    },
    orderBy: { updatedAt: 'desc' },
    select: { source: true },
    take: 200,
  })

  for (const row of rows) {
    if (isHttpSource(row.source)) return trimStr(row.source)
  }
  return null
}

async function registryReportWithHighestYear(
  companyId: string
): Promise<{ id: string; reportYear: string | null } | null> {
  const reports = await prisma.report.findMany({
    where: { wikidataId: companyId },
    select: {
      id: true,
      url: true,
      companyName: true,
      wikidataId: true,
      reportYear: true,
      sourceUrl: true,
      s3Url: true,
      sha256: true,
    },
  })

  if (reports.length === 0) return null

  const maxYear = Math.max(
    ...reports.map((r) => parseReportYear(r.reportYear) ?? -1)
  )
  if (maxYear < 0) {
    const fallback = pickRowToKeep(reports as RegistryReportIdentityRow[])
    return { id: fallback.id, reportYear: fallback.reportYear }
  }

  const tiedAtMaxYear = reports.filter(
    (r) => (parseReportYear(r.reportYear) ?? -1) === maxYear
  )
  const chosen = pickRowToKeep(tiedAtMaxYear as RegistryReportIdentityRow[])
  return { id: chosen.id, reportYear: chosen.reportYear }
}

async function resolveLatestReportForCompany(
  companyId: string,
  companyName: string,
  companyPeriods: PeriodRow[],
  dryRun: boolean
): Promise<LatestResolution> {
  const periodIds = companyPeriods.map((p) => p.id)
  const metadataSource = await latestMetadataSourceForPeriods(periodIds)

  if (metadataSource) {
    if (dryRun) {
      return {
        kind: 'metadata-dry-run',
        sourcePreview: metadataSource.slice(0, 100),
      }
    }

    const webUrl = bestWebUrl(metadataSource)
    const s3Url = bestS3Url(null, metadataSource)
    const url = webUrl ?? s3Url ?? metadataSource

    const report = await registryService.upsertReportInRegistry({
      companyName,
      wikidataId: companyId,
      url,
      sourceUrl: webUrl ?? null,
      s3Url: s3Url ?? null,
      sha256: null,
    })

    return {
      kind: 'metadata',
      registryReportId: report.id,
      sourcePreview: metadataSource.slice(0, 100),
    }
  }

  const registryRow = await registryReportWithHighestYear(companyId)
  if (registryRow) {
    return {
      kind: 'registry',
      registryReportId: registryRow.id,
      reportYear: registryRow.reportYear,
    }
  }

  return { kind: 'synthetic', registryReportId: null }
}

async function findOrCreateCompanyReport(
  companyId: string,
  registryReportId: string | null,
  cache: Map<string, string>
): Promise<string> {
  const cacheKey = `${companyId}::${registryReportId ?? 'synthetic'}`
  const cached = cache.get(cacheKey)
  if (cached) return cached

  const existing = await prisma.companyReport.findFirst({
    where: {
      companyId,
      registryReportId: registryReportId ?? null,
    },
    select: { id: true },
  })

  const companyReportId =
    existing?.id ??
    (
      await prisma.companyReport.create({
        data: {
          companyId,
          registryReportId: registryReportId ?? null,
        },
      })
    ).id

  cache.set(cacheKey, companyReportId)
  return companyReportId
}

async function main() {
  const { values } = parseArgs({
    options: {
      'dry-run': { type: 'boolean', default: false },
    },
  })
  const dryRun = Boolean(values['dry-run'])

  const resolutionCounts = {
    metadata: 0,
    registry: 0,
    synthetic: 0,
  }

  try {
    const periods = await prisma.reportingPeriod.findMany({
      where: { companyReportId: null },
      select: {
        id: true,
        year: true,
        companyId: true,
        reportURL: true,
        reportS3Url: true,
        reportSha256: true,
        company: { select: { name: true } },
      },
      orderBy: { id: 'asc' },
    })

    const total = await prisma.reportingPeriod.count()
    const alreadyLinked = total - periods.length
    console.log(
      `${total} total periods; ${alreadyLinked} already linked; ${periods.length} to process.`
    )

    if (periods.length === 0) {
      console.log('Nothing to do.')
      return
    }

    const byCompany = groupPeriodsByCompany(periods)
    console.log(
      `Linking ${periods.length} period(s) across ${byCompany.size} companies (one CompanyReport shell per company).`
    )

    const companyReportCache = new Map<string, string>()
    let linked = 0
    let errors = 0

    for (const [companyId, companyPeriods] of byCompany) {
      const companyName = companyPeriods[0]?.company.name ?? companyId

      try {
        const resolution = await resolveLatestReportForCompany(
          companyId,
          companyName,
          companyPeriods,
          dryRun
        )

        if (resolution.kind === 'metadata-dry-run') {
          resolutionCounts.metadata++
        } else {
          resolutionCounts[resolution.kind]++
        }

        if (dryRun) {
          const via =
            resolution.kind === 'metadata-dry-run'
              ? `metadata ${resolution.sourcePreview}`
              : resolution.kind === 'registry'
                ? `registry reportYear=${resolution.reportYear ?? '—'}`
                : 'synthetic'
          console.log(
            `[dry-run] ${companyId}: ${companyPeriods.length} period(s) → ${via}`
          )
          linked += companyPeriods.length
          continue
        }

        const registryReportId =
          resolution.kind === 'synthetic' ? null : resolution.registryReportId

        const companyReportId = await findOrCreateCompanyReport(
          companyId,
          registryReportId,
          companyReportCache
        )

        await prisma.reportingPeriod.updateMany({
          where: {
            id: { in: companyPeriods.map((p) => p.id) },
          },
          data: { companyReportId },
        })

        linked += companyPeriods.length
      } catch (err) {
        errors++
        console.error(`  [error] company ${companyId}:`, err)
      }
    }

    console.log(
      dryRun
        ? `[dry-run] Would link ${linked} period(s) on ${byCompany.size} companies.`
        : `Linked ${linked} period(s) on ${byCompany.size} companies${errors > 0 ? `; ${errors} company error(s)` : ''}.`
    )
    console.log(
      `Resolution: metadata=${resolutionCounts.metadata} registry=${resolutionCounts.registry} synthetic=${resolutionCounts.synthetic}`
    )

    if (!dryRun && linked > 0) {
      console.log('Setting reportYear on CompanyReport rows from max linked period year…')

      const companyReports = await prisma.companyReport.findMany({
        where: { reportYear: null },
        select: {
          id: true,
          reportingPeriods: { select: { year: true } },
        },
      })

      let yearUpdates = 0
      for (const companyReport of companyReports) {
        const maxYear = companyReport.reportingPeriods
          .map((p) => p.year)
          .filter(Boolean)
          .sort()
          .at(-1)

        if (maxYear) {
          await prisma.companyReport.update({
            where: { id: companyReport.id },
            data: { reportYear: maxYear },
          })
          yearUpdates++
        }
      }

      console.log(`Updated reportYear on ${yearUpdates} CompanyReport row(s).`)
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
